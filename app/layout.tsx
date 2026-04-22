import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0A66C2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'My LinkedIn Team — Posts com IA',
  description: 'Crie posts profissionais e impactantes para o LinkedIn com uma equipe de agentes IA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LinkedIn Team',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
