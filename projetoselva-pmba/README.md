# 🌿 @projetoselva - Plataforma PMBA 2025

Plataforma completa de estudos para o concurso da Polícia Militar da Bahia 2025.

## ✨ Funcionalidades

- ✅ **Edital Verticalizado** - Todos os 131 tópicos organizados por disciplina
- ✅ **Controle de Questões** - Registre acertos e erros por tópico
- ✅ **Gráficos de Evolução** - Visualize seu progresso em tempo real
- ✅ **Login com Google** - Acesse de qualquer dispositivo
- ✅ **Sincronização na Nuvem** - Seus dados salvos automaticamente
- ✅ **100% Responsivo** - Funciona em celular, tablet e desktop

## 🚀 Instalação

### 1. Clonar o projeto

```bash
git clone <seu-repositorio>
cd projetoselva-pmba
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um novo projeto
3. Vá em **SQL Editor** e execute o conteúdo do arquivo `supabase-schema.sql`
4. Vá em **Settings > API** e copie:
   - Project URL
   - anon public key

### 4. Configurar variáveis de ambiente

Renomeie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 5. Configurar autenticação (opcional - Google Login)

1. No Supabase, vá em **Authentication > Providers**
2. Habilite **Google**
3. Configure suas credenciais do Google Cloud Console
4. Adicione as URLs de callback

### 6. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📦 Deploy na Vercel

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Importe o repositório
4. Configure as variáveis de ambiente
5. Deploy automático!

## 🗂️ Estrutura do Projeto

```
projetoselva-pmba/
├── app/
│   ├── auth/
│   │   ├── login/page.js      # Página de login
│   │   ├── cadastro/page.js   # Página de cadastro
│   │   └── callback/route.js  # Callback OAuth
│   ├── dashboard/
│   │   ├── page.js            # Dashboard (server)
│   │   └── dashboard-client.js # Dashboard (client)
│   ├── layout.js              # Layout principal
│   ├── page.js                # Landing page
│   └── globals.css            # Estilos globais
├── lib/
│   ├── supabase-browser.js    # Cliente Supabase (browser)
│   ├── supabase-server.js     # Cliente Supabase (server)
│   └── edital-pmba.js         # Dados do edital
├── middleware.js              # Proteção de rotas
├── supabase-schema.sql        # Schema do banco de dados
└── package.json
```

## 📊 Banco de Dados

### Tabelas

- **profiles** - Dados dos usuários
- **progresso** - Progresso por tópico (concluído, acertos, erros)
- **sessoes_estudo** - Registro de sessões de estudo
- **metas** - Metas de estudo (diária, semanal, mensal)

### Row Level Security

Todas as tabelas possuem RLS configurado para que cada usuário só acesse seus próprios dados.

## 🎨 Tecnologias

- **Next.js 14** - Framework React
- **Supabase** - Backend as a Service (auth + database)
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **Lucide Icons** - Ícones

## 📱 PWA (Progressive Web App)

Para transformar em PWA instalável, adicione:

1. Arquivo `manifest.json` em `/public`
2. Service Worker
3. Ícones em diferentes tamanhos

## 🤝 Contribuição

Contribuições são bem-vindas! Abra uma issue ou pull request.

## 📄 Licença

MIT License - Use livremente para fins educacionais.

---

Feito com 💚 por [@projetoselva](https://instagram.com/projetoselva)
