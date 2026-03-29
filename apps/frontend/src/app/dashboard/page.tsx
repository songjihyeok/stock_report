import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GTTDashboard from './GTTDashboard';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: { session } } = await supabase.auth.getSession();

  return (
    <GTTDashboard
      userEmail={user.email || ''}
      userId={user.id}
      accessToken={session?.access_token || ''}
    />
  );
}
