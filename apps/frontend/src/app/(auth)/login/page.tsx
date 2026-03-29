import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
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
          <h1 className="font-heading font-bold text-2xl text-text text-center mb-2">Welcome Back</h1>
          <p className="text-text-secondary text-sm text-center mb-6">Sign in to access your dashboard</p>

          <Suspense fallback={<div className="text-center text-text-secondary text-sm py-4">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-secondary font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
