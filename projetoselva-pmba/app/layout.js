import './globals.css'

export const metadata = {
  title: '@projetoselva - Plano de Estudos PMBA 2025',
  description: 'Plataforma de estudos para o concurso da Polícia Militar da Bahia',
  keywords: ['PMBA', 'concurso', 'polícia militar', 'bahia', 'estudos'],
  authors: [{ name: '@projetoselva' }],
  manifest: '/manifest.json',
  themeColor: '#10b981',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
