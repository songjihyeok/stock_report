import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 600, margin: '100px auto', textAlign: 'center' }}>
      <h1>VB Start Kit</h1>
      <p>Next.js + Supabase + NestJS</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign Up</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    </main>
  );
}
