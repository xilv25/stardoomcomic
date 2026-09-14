export const metadata = {
  title: 'StarDoom Comic',
  description: 'Web Komik Ultra-Lite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-[#050505] text-white antialiased">{children}</body>
    </html>
  )
}
