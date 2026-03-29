import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GTT - Global Theme Tracer',
  description: 'AI-powered global news analysis for strategic investment theme discovery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
