-- ===========================================
-- BUSCADOR DE JURISPRUDÊNCIA TJBA - PMBA
-- @projetoselva
-- Execute no SQL Editor do Supabase
-- ===========================================

-- Habilitar extensão unaccent para busca sem acentos
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- TABELA: decisoes
-- ===========================================
CREATE TABLE IF NOT EXISTS public.decisoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Identificação
  numero_processo TEXT,
  ano INTEGER,
  data_julgamento DATE,

  -- Partes e órgão
  relator TEXT,
  orgao_julgador TEXT,          -- Ex: "1ª Câmara Cível"
  requerente TEXT,
  requerido TEXT,               -- Geralmente PMBA/Estado da Bahia

  -- Conteúdo
  ementa TEXT,                  -- Resumo jurídico
  texto_integra TEXT,           -- Texto completo do acórdão

  -- Classificação
  resultado TEXT,               -- 'DEFERIDO', 'INDEFERIDO', 'PARCIALMENTE DEFERIDO', 'EXTINTO', 'NÃO CONHECIDO'
  tipo_acao TEXT DEFAULT 'MANDADO DE SEGURANÇA',
  temas TEXT[],                 -- Array de temas ex: ['PMBA', 'PROMOÇÃO', 'ACESSO']
  palavras_chave TEXT[],        -- Tags adicionais

  -- Metadados do scraping
  fonte_url TEXT,
  metadata JSONB,               -- Dados extras do scraping (HTML original, etc.)

  -- Full-text search (gerado automaticamente via trigger)
  search_vector TSVECTOR,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

-- Full-text search (GIN index)
CREATE INDEX IF NOT EXISTS decisoes_search_idx
  ON public.decisoes USING GIN(search_vector);

-- Trigram index para busca parcial
CREATE INDEX IF NOT EXISTS decisoes_ementa_trgm_idx
  ON public.decisoes USING GIN(ementa gin_trgm_ops);

-- Índices comuns de filtragem
CREATE INDEX IF NOT EXISTS decisoes_ano_idx ON public.decisoes(ano);
CREATE INDEX IF NOT EXISTS decisoes_resultado_idx ON public.decisoes(resultado);
CREATE INDEX IF NOT EXISTS decisoes_relator_idx ON public.decisoes(relator);
CREATE INDEX IF NOT EXISTS decisoes_data_idx ON public.decisoes(data_julgamento DESC);
CREATE INDEX IF NOT EXISTS decisoes_temas_idx ON public.decisoes USING GIN(temas);
CREATE INDEX IF NOT EXISTS decisoes_numero_processo_idx ON public.decisoes(numero_processo);

-- ===========================================
-- TRIGGER: Atualiza search_vector automaticamente
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_decisoes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(COALESCE(NEW.ementa, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(COALESCE(NEW.numero_processo, ''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(COALESCE(NEW.relator, ''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(COALESCE(NEW.resultado, ''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(COALESCE(array_to_string(NEW.temas, ' '), ''))), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(COALESCE(LEFT(NEW.texto_integra, 50000), ''))), 'D');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decisoes_search_vector_trigger ON public.decisoes;
CREATE TRIGGER decisoes_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.decisoes
  FOR EACH ROW EXECUTE FUNCTION public.update_decisoes_search_vector();

-- ===========================================
-- FUNÇÃO: Busca full-text com ranking
-- ===========================================
CREATE OR REPLACE FUNCTION public.buscar_decisoes(
  p_query TEXT,
  p_ano INTEGER DEFAULT NULL,
  p_resultado TEXT DEFAULT NULL,
  p_relator TEXT DEFAULT NULL,
  p_tema TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  numero_processo TEXT,
  ano INTEGER,
  data_julgamento DATE,
  relator TEXT,
  orgao_julgador TEXT,
  ementa TEXT,
  resultado TEXT,
  temas TEXT[],
  rank REAL,
  headline TEXT,
  total_count BIGINT
) AS $$
DECLARE
  v_tsquery TSQUERY;
  v_query_normalized TEXT;
BEGIN
  -- Normaliza query e monta tsquery
  v_query_normalized := unaccent(trim(p_query));

  IF v_query_normalized = '' OR v_query_normalized IS NULL THEN
    v_tsquery := NULL;
  ELSE
    BEGIN
      v_tsquery := plainto_tsquery('portuguese', v_query_normalized);
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := NULL;
    END;
  END IF;

  RETURN QUERY
  WITH resultados AS (
    SELECT
      d.id,
      d.numero_processo,
      d.ano,
      d.data_julgamento,
      d.relator,
      d.orgao_julgador,
      d.ementa,
      d.resultado,
      d.temas,
      CASE
        WHEN v_tsquery IS NOT NULL
        THEN ts_rank_cd(d.search_vector, v_tsquery, 32)
        ELSE 1.0
      END::REAL AS rank,
      CASE
        WHEN v_tsquery IS NOT NULL
        THEN ts_headline('portuguese', unaccent(COALESCE(d.ementa, '')), v_tsquery,
          'MaxWords=40, MinWords=20, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter= " ... "')
        ELSE LEFT(d.ementa, 200)
      END AS headline,
      COUNT(*) OVER() AS total_count
    FROM public.decisoes d
    WHERE
      -- Filtro de busca textual
      (v_tsquery IS NULL OR d.search_vector @@ v_tsquery)
      -- Filtros opcionais
      AND (p_ano IS NULL OR d.ano = p_ano)
      AND (p_resultado IS NULL OR d.resultado ILIKE p_resultado)
      AND (p_relator IS NULL OR d.relator ILIKE '%' || p_relator || '%')
      AND (p_tema IS NULL OR p_tema = ANY(d.temas))
    ORDER BY
      CASE WHEN v_tsquery IS NOT NULL THEN ts_rank_cd(d.search_vector, v_tsquery, 32) ELSE 1.0 END DESC,
      d.data_julgamento DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT * FROM resultados;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================
-- FUNÇÃO: Detectar conflitos automáticos
-- Decisões sobre o mesmo tema com resultados opostos
-- ===========================================
CREATE OR REPLACE FUNCTION public.detectar_conflitos(
  p_tema TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  tema TEXT,
  total_deferidos BIGINT,
  total_indeferidos BIGINT,
  ids_deferidos UUID[],
  ids_indeferidos UUID[],
  exemplos_deferidos JSONB,
  exemplos_indeferidos JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH por_tema AS (
    SELECT
      unnest(d.temas) AS tema_item,
      d.id,
      d.resultado,
      d.numero_processo,
      d.data_julgamento,
      d.relator,
      LEFT(d.ementa, 150) AS ementa_resumo
    FROM public.decisoes d
    WHERE
      (p_tema IS NULL OR p_tema = ANY(d.temas))
      AND d.resultado IN ('DEFERIDO', 'INDEFERIDO', 'PARCIALMENTE DEFERIDO', 'NÃO PROVIDO', 'PROVIDO')
  ),
  agrupado AS (
    SELECT
      t.tema_item AS tema,
      COUNT(*) FILTER (WHERE t.resultado IN ('DEFERIDO', 'PROVIDO')) AS total_deferidos,
      COUNT(*) FILTER (WHERE t.resultado IN ('INDEFERIDO', 'NÃO PROVIDO')) AS total_indeferidos,
      array_agg(t.id) FILTER (WHERE t.resultado IN ('DEFERIDO', 'PROVIDO')) AS ids_deferidos,
      array_agg(t.id) FILTER (WHERE t.resultado IN ('INDEFERIDO', 'NÃO PROVIDO')) AS ids_indeferidos,
      jsonb_agg(jsonb_build_object(
        'id', t.id, 'numero_processo', t.numero_processo,
        'data', t.data_julgamento, 'relator', t.relator, 'ementa', t.ementa_resumo
      )) FILTER (WHERE t.resultado IN ('DEFERIDO', 'PROVIDO')) AS exemplos_deferidos,
      jsonb_agg(jsonb_build_object(
        'id', t.id, 'numero_processo', t.numero_processo,
        'data', t.data_julgamento, 'relator', t.relator, 'ementa', t.ementa_resumo
      )) FILTER (WHERE t.resultado IN ('INDEFERIDO', 'NÃO PROVIDO')) AS exemplos_indeferidos
    FROM por_tema t
    GROUP BY t.tema_item
  )
  SELECT
    a.tema,
    a.total_deferidos,
    a.total_indeferidos,
    a.ids_deferidos,
    a.ids_indeferidos,
    a.exemplos_deferidos,
    a.exemplos_indeferidos
  FROM agrupado a
  WHERE
    a.total_deferidos > 0
    AND a.total_indeferidos > 0
  ORDER BY (a.total_deferidos + a.total_indeferidos) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================
-- VIEW: Estatísticas gerais da jurisprudência
-- ===========================================
CREATE OR REPLACE VIEW public.stats_jurisprudencia AS
SELECT
  COUNT(*) AS total_decisoes,
  COUNT(*) FILTER (WHERE resultado IN ('DEFERIDO', 'PROVIDO')) AS total_deferidos,
  COUNT(*) FILTER (WHERE resultado IN ('INDEFERIDO', 'NÃO PROVIDO')) AS total_indeferidos,
  COUNT(*) FILTER (WHERE resultado = 'PARCIALMENTE DEFERIDO') AS total_parciais,
  COUNT(DISTINCT relator) AS total_relatores,
  COUNT(DISTINCT ano) AS anos_cobertos,
  MIN(ano) AS ano_inicial,
  MAX(ano) AS ano_final,
  ROUND(
    COUNT(*) FILTER (WHERE resultado IN ('DEFERIDO', 'PROVIDO'))::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS pct_deferidos
FROM public.decisoes;

-- ===========================================
-- RLS: Decisões são PÚBLICAS (leitura livre)
-- ===========================================
ALTER TABLE public.decisoes ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler
CREATE POLICY "Decisoes publicas - leitura" ON public.decisoes
  FOR SELECT USING (true);

-- Apenas service_role pode inserir/atualizar/deletar (import de dados)
CREATE POLICY "Apenas service_role pode inserir" ON public.decisoes
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Apenas service_role pode atualizar" ON public.decisoes
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Apenas service_role pode deletar" ON public.decisoes
  FOR DELETE USING (auth.role() = 'service_role');

-- ===========================================
-- DADOS DE EXEMPLO (para testar antes do import)
-- Remova após importar seus dados reais
-- ===========================================
INSERT INTO public.decisoes (
  numero_processo, ano, data_julgamento, relator, orgao_julgador,
  requerente, requerido, ementa, resultado, temas
) VALUES
(
  '0012345-67.2023.8.05.0001', 2023,
  '2023-08-15',
  'Des. João Silva Santos',
  '1ª Câmara Cível',
  'Soldado PM Fulano de Tal',
  'Estado da Bahia / PMBA',
  'MANDADO DE SEGURANÇA. POLÍCIA MILITAR DA BAHIA. PROMOÇÃO POR MERECIMENTO. PRETERIÇÃO. ILEGALIDADE. ORDEM CONCEDIDA. A promoção por merecimento na PMBA exige observância dos critérios objetivos previstos no CPPM, sendo ilegal a preterição de oficial com maior pontuação sem fundamentação adequada.',
  'DEFERIDO',
  ARRAY['PROMOÇÃO', 'MERECIMENTO', 'PMBA', 'PRETERIÇÃO']
),
(
  '0098765-43.2022.8.05.0001', 2022,
  '2022-11-20',
  'Des. Maria Costa Oliveira',
  '2ª Câmara Cível',
  'Cabo PM José de Souza',
  'Comandante Geral da PMBA',
  'MANDADO DE SEGURANÇA. POLICIAL MILITAR. PUNIÇÃO DISCIPLINAR. PRISÃO. PROPORCIONALIDADE. SEGURANÇA DENEGADA. A sanção disciplinar de prisão aplicada a policial militar por conduta tipificada no regulamento disciplinar não configura ilegalidade ou abuso de poder quando observado o due process of law.',
  'INDEFERIDO',
  ARRAY['PUNIÇÃO DISCIPLINAR', 'PRISÃO', 'PMBA', 'PROPORCIONALIDADE']
),
(
  '0011111-22.2021.8.05.0001', 2021,
  '2021-05-10',
  'Des. Carlos Eduardo Lima',
  '3ª Câmara Cível',
  'Tenente PM Ana Paula Ferreira',
  'Estado da Bahia',
  'MANDADO DE SEGURANÇA. PMBA. LICENÇA PARA TRATAMENTO DE SAÚDE. NEGATIVA DA ADMINISTRAÇÃO. DIREITO LÍQUIDO E CERTO. SEGURANÇA CONCEDIDA. Comprovada a necessidade de afastamento por laudo médico, é ilegal o ato administrativo que nega licença para tratamento de saúde a policial militar.',
  'DEFERIDO',
  ARRAY['LICENÇA SAÚDE', 'AFASTAMENTO', 'PMBA', 'DIREITO À SAÚDE']
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- FINALIZADO!
-- Próximos passos:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Use o script scripts/import-decisoes.js para importar seus dados
-- 3. Acesse /jurisprudencia na plataforma
-- ===========================================
