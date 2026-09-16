import './globals.css';

export const metadata = {
  title: 'StarDoom Comic',
  description: 'Platform Web Komik Ultra-Lite',
  manifest: '/manifest.json',
  themeColor: '#020202',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020202" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#050505] text-white antialiased selection:bg-red-900/50">
        {children}
      </body>
    </html>
  );
}
