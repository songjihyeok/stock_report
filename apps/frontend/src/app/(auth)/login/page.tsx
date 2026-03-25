import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 400, margin: '100px auto' }}>
      <h1>Login</h1>
      <LoginForm />
      <p style={{ marginTop: 16 }}>
        Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
      </p>
    </main>
  );
}
