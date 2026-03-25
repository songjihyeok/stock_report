import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VB Start Kit',
  description: 'Next.js + Supabase + NestJS Starter Kit',
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
