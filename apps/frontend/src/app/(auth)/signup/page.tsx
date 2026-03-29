import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background font-body flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-heading font-bold text-lg">G</span>
          </div>
          <span className="font-heading font-bold text-2xl text-text">GTT</span>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <h1 className="font-heading font-bold text-2xl text-text text-center mb-2">Create Account</h1>
          <p className="text-text-secondary text-sm text-center mb-6">Start tracking global investment themes</p>

          <SignupForm />
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-secondary font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
