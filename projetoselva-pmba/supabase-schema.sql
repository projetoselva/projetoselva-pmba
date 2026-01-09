-- ===========================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- @projetoselva - Plataforma PMBA 2025
-- ===========================================
-- Execute este script no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New Query)
-- ===========================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABELA: profiles (dados do usuário)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nome TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- TABELA: progresso (progresso por tópico)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.progresso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  disciplina TEXT NOT NULL,
  topico_index INTEGER NOT NULL,
  concluido BOOLEAN DEFAULT FALSE,
  acertos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  revisoes INTEGER DEFAULT 0,
  ultima_revisao TIMESTAMP WITH TIME ZONE,
  anotacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice único para evitar duplicatas
  UNIQUE(user_id, disciplina, topico_index)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_progresso_user_id ON public.progresso(user_id);
CREATE INDEX IF NOT EXISTS idx_progresso_disciplina ON public.progresso(disciplina);

-- ===========================================
-- TABELA: sessoes_estudo (registro de sessões)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.sessoes_estudo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  disciplina TEXT NOT NULL,
  duracao_minutos INTEGER DEFAULT 0,
  questoes_resolvidas INTEGER DEFAULT 0,
  acertos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  data_sessao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sessoes_user_id ON public.sessoes_estudo(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_data ON public.sessoes_estudo(data_sessao);

-- ===========================================
-- TABELA: metas (metas de estudo)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL, -- 'diaria', 'semanal', 'mensal'
  meta_questoes INTEGER DEFAULT 0,
  meta_minutos INTEGER DEFAULT 0,
  meta_topicos INTEGER DEFAULT 0,
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para progresso
CREATE POLICY "Usuários podem ver próprio progresso" ON public.progresso
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio progresso" ON public.progresso
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprio progresso" ON public.progresso
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprio progresso" ON public.progresso
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para sessoes_estudo
CREATE POLICY "Usuários podem ver próprias sessões" ON public.sessoes_estudo
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprias sessões" ON public.sessoes_estudo
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para metas
CREATE POLICY "Usuários podem ver próprias metas" ON public.metas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprias metas" ON public.metas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprias metas" ON public.metas
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progresso_updated_at
  BEFORE UPDATE ON public.progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- VIEW: Estatísticas do usuário
-- ===========================================
CREATE OR REPLACE VIEW public.estatisticas_usuario AS
SELECT 
  p.user_id,
  COUNT(*) FILTER (WHERE p.concluido = TRUE) as topicos_concluidos,
  COUNT(*) as total_registros,
  SUM(p.acertos) as total_acertos,
  SUM(p.erros) as total_erros,
  CASE 
    WHEN SUM(p.acertos) + SUM(p.erros) > 0 
    THEN ROUND((SUM(p.acertos)::NUMERIC / (SUM(p.acertos) + SUM(p.erros))) * 100, 1)
    ELSE 0 
  END as percentual_acertos
FROM public.progresso p
GROUP BY p.user_id;

-- ===========================================
-- FINALIZADO!
-- ===========================================
-- Após executar este script:
-- 1. Vá em Authentication > Providers
-- 2. Habilite Email e Google (ou outros provedores)
-- 3. Configure as URLs de redirecionamento
-- ===========================================
