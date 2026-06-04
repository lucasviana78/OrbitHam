import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'OrbitHam — Mission Control',
  description:
    'Acompanhamento de satélites em órbita baixa para radioamadores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans antialiased starfield">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
