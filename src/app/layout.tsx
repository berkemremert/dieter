import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dieter — Diyetisyenler için Diyet Planı Yönetim Aracı',
  description:
    'Danışanlarınız için kişiselleştirilmiş diyet planları oluşturun, yönetin ve PDF olarak dışa aktarın.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
