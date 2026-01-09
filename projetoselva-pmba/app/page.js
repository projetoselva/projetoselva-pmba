import Link from 'next/link'
import { BookOpen, Target, TrendingUp, Users, CheckCircle, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">@projetoselva</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login" className="btn-secondary">
              Entrar
            </Link>
            <Link href="/auth/cadastro" className="btn-primary">
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sua aprovação na PMBA 2025<br />começa aqui
          </h1>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Plataforma completa de estudos com edital verticalizado, 
            controle de questões e acompanhamento de desempenho em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/cadastro" className="bg-white text-emerald-600 font-bold py-3 px-8 rounded-lg hover:bg-emerald-50 transition-all inline-flex items-center justify-center gap-2">
              Criar Conta Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#recursos" className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white/10 transition-all">
              Ver Recursos
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold">131</div>
              <div className="text-emerald-200 text-sm">Tópicos do Edital</div>
            </div>
            <div>
              <div className="text-3xl font-bold">12</div>
              <div className="text-emerald-200 text-sm">Disciplinas</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-emerald-200 text-sm">Gratuito</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Tudo que você precisa para passar
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Ferramentas desenvolvidas especificamente para o concurso PMBA 2025
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Edital Verticalizado</h3>
              <p className="text-gray-500">
                Todos os 131 tópicos organizados por disciplina. Marque o que já estudou e acompanhe seu progresso.
              </p>
            </div>
            
            <div className="card p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Controle de Questões</h3>
              <p className="text-gray-500">
                Registre acertos e erros por tópico. Saiba exatamente onde precisa melhorar.
              </p>
            </div>
            
            <div className="card p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Gráficos de Evolução</h3>
              <p className="text-gray-500">
                Visualize seu desempenho ao longo do tempo com gráficos interativos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disciplinas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Disciplinas do Edital
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Português', 'Matemática', 'Direito Penal', 'Direito Constitucional',
              'Direito Administrativo', 'Direito Penal Militar', 'Direitos Humanos',
              'Igualdade Racial e Gênero', 'História', 'Geografia', 'Informática', 'Atualidades'
            ].map((disc) => (
              <div key={disc} className="bg-white rounded-lg p-4 border border-gray-200 text-center hover:border-emerald-500 hover:shadow-md transition-all">
                <span className="text-gray-700 font-medium">{disc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-emerald-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Comece agora mesmo!
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Crie sua conta gratuita e tenha acesso completo à plataforma.
            Seus dados ficam salvos na nuvem e você acessa de qualquer lugar.
          </p>
          <Link href="/auth/cadastro" className="bg-white text-emerald-600 font-bold py-4 px-10 rounded-lg hover:bg-emerald-50 transition-all inline-flex items-center gap-2 text-lg">
            Criar Minha Conta
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">@projetoselva</span>
            </div>
            <p className="text-sm">
              © 2025 @projetoselva. Plataforma gratuita de estudos para concursos.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/projetoselva" target="_blank" rel="noopener" className="hover:text-white transition-colors">
                Instagram
              </a>
              <a href="https://youtube.com/@projetoselva" target="_blank" rel="noopener" className="hover:text-white transition-colors">
                YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
