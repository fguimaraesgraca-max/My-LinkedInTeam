import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My LinkedIn Team — Posts com IA',
  description: 'Crie posts profissionais e impactantes para o LinkedIn com uma equipe de agentes IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
