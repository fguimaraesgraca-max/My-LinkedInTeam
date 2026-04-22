import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My LinkedIn Team',
    short_name: 'LinkedIn Team',
    description: 'Crie posts profissionais para o LinkedIn com IA',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F2EF',
    theme_color: '#0A66C2',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
