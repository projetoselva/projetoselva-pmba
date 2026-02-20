/**
 * Script de Import de Decisões TJBA
 * @projetoselva - Buscador de Jurisprudência PMBA
 *
 * Uso:
 *   node scripts/import-decisoes.js --file=./dados/decisoes.json
 *   node scripts/import-decisoes.js --dir=./dados/
 *   node scripts/import-decisoes.js --file=./dados/decisoes.json --dry-run
 *
 * Requer variável SUPABASE_SERVICE_ROLE_KEY no .env.local
 * (Não use a anon key para imports - use a service_role_key)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carrega .env.local manualmente (sem dotenv)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado')
    process.exit(1)
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  lines.forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  })
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// =====================================================
// MAPEADORES: Adapte conforme a estrutura do seu JSON
// =====================================================

/**
 * Extrai o resultado do acórdão a partir do texto da ementa ou campo específico.
 * Adapte esta função para o formato do seu scraping.
 */
function extrairResultado(item) {
  // Se já tiver campo resultado
  if (item.resultado) return item.resultado.toUpperCase()

  const texto = (item.ementa || item.texto || item.decisao || '').toUpperCase()

  if (texto.includes('SEGURANÇA CONCEDIDA') || texto.includes('ORDEM CONCEDIDA') ||
      texto.includes('RECURSO PROVIDO') || texto.includes('APELO PROVIDO')) return 'DEFERIDO'

  if (texto.includes('SEGURANÇA DENEGADA') || texto.includes('ORDEM DENEGADA') ||
      texto.includes('RECURSO NÃO PROVIDO') || texto.includes('APELO NÃO PROVIDO') ||
      texto.includes('RECURSO DESPROVIDO')) return 'INDEFERIDO'

  if (texto.includes('PARCIALMENTE')) return 'PARCIALMENTE DEFERIDO'
  if (texto.includes('EXTINTO')) return 'EXTINTO'
  if (texto.includes('NÃO CONHECIDO')) return 'NÃO CONHECIDO'

  return null
}

/**
 * Extrai temas/assuntos da ementa.
 * Palavras-chave comuns em MS envolvendo PMBA.
 */
function extrairTemas(item) {
  if (item.temas && Array.isArray(item.temas)) return item.temas
  if (item.assuntos && Array.isArray(item.assuntos)) return item.assuntos

  const texto = (item.ementa || '').toUpperCase()
  const temas = []

  const mapeamento = [
    ['PROMOÇÃO', ['PROMOÇ', 'PROMOV', 'PRETERID']],
    ['PUNIÇÃO DISCIPLINAR', ['PUNIÇ', 'DISCIPLIN', 'PRISÃO', 'ADVERTÊNCIA', 'REPREENSÃO']],
    ['LICENÇA SAÚDE', ['LICENÇA', 'SAÚDE', 'MÉDIC', 'TRATAMENTO']],
    ['REFORMA', ['REFORM', 'INVALIDEZ', 'INCAPACIDADE']],
    ['SOLDO', ['SOLDO', 'REMUNERAÇ', 'VENCIMENTO', 'SALÁRIO']],
    ['FÉRIAS', ['FÉRIAS', 'FOLGA']],
    ['TRANSFERÊNCIA', ['TRANSFER', 'REMOÇÃO']],
    ['ACESSO', ['ACESSO', 'ANTIGUIDADE', 'MERECIMENTO']],
    ['DEMISSÃO', ['DEMISSÃO', 'EXPULSÃO', 'EXCLUSÃO']],
    ['CONCURSO', ['CONCURSO', 'APROVAÇÃO', 'CLASSIFICAÇÃO']],
    ['PENSÃO', ['PENSÃO', 'DEPENDENTE']],
    ['HORAS EXTRAS', ['HORA EXTRA', 'ADICIONAL']],
  ]

  mapeamento.forEach(([tema, palavras]) => {
    if (palavras.some(p => texto.includes(p))) temas.push(tema)
  })

  // Sempre adiciona PMBA se relevante
  if (!temas.includes('PMBA') && (texto.includes('PMBA') || texto.includes('POLÍCIA MILITAR'))) {
    temas.unshift('PMBA')
  }

  return temas
}

/**
 * Normaliza um item do JSON para o formato da tabela decisoes.
 *
 * Adapte os nomes dos campos conforme seu JSON de scraping.
 * Exemplos de campos comuns no scraping do TJBA:
 *   - item.numero / item.processo / item.numProcesso
 *   - item.ementa / item.ementaCompleta
 *   - item.data / item.dataJulgamento / item.dataPub
 *   - item.relator / item.nomeRelator
 *   - item.orgao / item.orgaoJulgador / item.camara
 *   - item.integra / item.textoCompleto / item.acordao
 *   - item.url / item.link
 */
function normalizarItem(item) {
  const ementa = item.ementa || item.ementaCompleta || item.resumo || ''
  const textoIntegra = item.integra || item.textoCompleto || item.acordao || item.texto || null

  // Tenta parsear a data
  let dataJulgamento = null
  const dataRaw = item.data || item.dataJulgamento || item.dataPub || item.data_julgamento
  if (dataRaw) {
    try {
      // Suporta formatos: "2023-08-15", "15/08/2023", "15/08/2023 00:00:00"
      const d = dataRaw.includes('/') ? dataRaw.split(' ')[0].split('/').reverse().join('-') : dataRaw.split('T')[0]
      dataJulgamento = new Date(d).toISOString().split('T')[0]
    } catch (_) {}
  }

  // Extrai o ano
  const ano = dataJulgamento ? parseInt(dataJulgamento.split('-')[0]) : (item.ano || null)

  return {
    numero_processo: item.numero || item.processo || item.numProcesso || item.numeroProcesso || null,
    ano,
    data_julgamento: dataJulgamento,
    relator: item.relator || item.nomeRelator || null,
    orgao_julgador: item.orgao || item.orgaoJulgador || item.camara || item.turma || null,
    requerente: item.requerente || item.impetrante || item.parte || null,
    requerido: item.requerido || item.impetrado || 'Estado da Bahia / PMBA',
    ementa: ementa || null,
    texto_integra: textoIntegra,
    resultado: extrairResultado(item),
    tipo_acao: item.tipo || item.tipoAcao || 'MANDADO DE SEGURANÇA',
    temas: extrairTemas(item),
    palavras_chave: item.palavrasChave || item.tags || [],
    fonte_url: item.url || item.link || item.fonte || null,
    metadata: {
      importado_em: new Date().toISOString(),
      fonte_original: item.fonte || 'scraping-tjba',
      ...( item.metadata || {} )
    }
  }
}

// =====================================================
// FUNÇÕES DE IMPORT
// =====================================================

async function importarLote(items, dryRun = false) {
  const normalizados = items
    .map(item => {
      try {
        return normalizarItem(item)
      } catch (err) {
        console.warn(`⚠️  Erro ao normalizar item:`, err.message)
        return null
      }
    })
    .filter(Boolean)

  if (dryRun) {
    console.log('\n🔍 DRY RUN - Primeiros 3 registros normalizados:')
    normalizados.slice(0, 3).forEach((r, i) => {
      console.log(`\n[${i + 1}]`, JSON.stringify(r, null, 2))
    })
    console.log(`\n✅ Total que seria inserido: ${normalizados.length} decisões`)
    return { inseridos: 0, erros: 0 }
  }

  // Insere em lotes de 100
  const LOTE = 100
  let inseridos = 0
  let erros = 0

  for (let i = 0; i < normalizados.length; i += LOTE) {
    const lote = normalizados.slice(i, i + LOTE)
    const { error } = await supabase
      .from('decisoes')
      .upsert(lote, { onConflict: 'numero_processo', ignoreDuplicates: false })

    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i / LOTE) + 1}:`, error.message)
      erros += lote.length
    } else {
      inseridos += lote.length
      process.stdout.write(`\r📥 Inserindo... ${inseridos}/${normalizados.length}`)
    }
  }

  return { inseridos, erros }
}

async function importarArquivo(filePath, dryRun) {
  console.log(`\n📂 Lendo arquivo: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`)
    return
  }

  const conteudo = fs.readFileSync(filePath, 'utf-8')
  let items

  try {
    const parsed = JSON.parse(conteudo)
    // Suporta: array direto, { decisoes: [] }, { data: [] }, { results: [] }
    items = Array.isArray(parsed)
      ? parsed
      : parsed.decisoes || parsed.data || parsed.results || parsed.items || Object.values(parsed)
  } catch (err) {
    console.error(`❌ Erro ao fazer parse do JSON: ${err.message}`)
    return
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error('❌ Nenhum item encontrado no arquivo')
    return
  }

  console.log(`📊 ${items.length} decisões encontradas`)
  const { inseridos, erros } = await importarLote(items, dryRun)

  if (!dryRun) {
    console.log(`\n✅ Import concluído: ${inseridos} inseridas, ${erros} erros`)
  }
}

async function importarDiretorio(dirPath, dryRun) {
  const arquivos = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'))
  console.log(`📁 ${arquivos.length} arquivo(s) JSON encontrado(s) em ${dirPath}`)

  for (const arquivo of arquivos) {
    await importarArquivo(path.join(dirPath, arquivo), dryRun)
  }
}

// =====================================================
// MAIN
// =====================================================
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const fileArg = args.find(a => a.startsWith('--file='))?.replace('--file=', '')
  const dirArg = args.find(a => a.startsWith('--dir='))?.replace('--dir=', '')

  console.log('🏛️  Buscador de Jurisprudência TJBA - @projetoselva')
  console.log('='.repeat(50))
  if (dryRun) console.log('🔍 MODO DRY RUN (nenhum dado será inserido)\n')

  if (fileArg) {
    await importarArquivo(path.resolve(fileArg), dryRun)
  } else if (dirArg) {
    await importarDiretorio(path.resolve(dirArg), dryRun)
  } else {
    console.log(`
Uso:
  node scripts/import-decisoes.js --file=./dados/decisoes.json
  node scripts/import-decisoes.js --dir=./dados/
  node scripts/import-decisoes.js --file=./dados/decisoes.json --dry-run

Formato esperado do JSON:
  Array de objetos com campos como:
    numero, ementa, data, relator, orgao, integra, url, resultado

Exemplos de campos aceitos:
  numero    -> numero_processo (ex: "0012345-67.2023.8.05.0001")
  ementa    -> texto resumido da decisão
  data      -> "2023-08-15" ou "15/08/2023"
  relator   -> nome do desembargador
  orgao     -> órgão julgador (ex: "1ª Câmara Cível")
  integra   -> texto completo do acórdão
  url       -> link para o documento no TJBA
  resultado -> DEFERIDO | INDEFERIDO | PARCIALMENTE DEFERIDO

Para customizar o mapeamento dos campos, edite a função normalizarItem()
neste arquivo.
    `)
    process.exit(0)
  }
}

main().catch(console.error)
