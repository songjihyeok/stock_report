import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <main style={{ maxWidth: 400, margin: '100px auto' }}>
      <h1>Sign Up</h1>
      <SignupForm />
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </main>
  );
}
