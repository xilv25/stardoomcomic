export const metadata = {
  title: 'StarDoom Comic',
  description: 'Platform Web Komik Ultra-Lite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#050505] text-white antialiased selection:bg-red-900/50">
        {children}
      </body>
    </html>
  );
}
