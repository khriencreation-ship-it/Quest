import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from '@/components/onboarding/OnboardingClient';

export default async function OnboardingPage() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    // Not logged in
    if (error || !data?.user) {
        redirect('/login');
    }

    const user = data.user;
    const role = user.user_metadata?.role;

    // Not a manager — regular users go straight to dashboard
    if (role !== 'manager') {
        redirect('/dashboard');
    }

    // Manager who already completed onboarding — go to dashboard
    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

    if (company) {
        redirect('/dashboard');
    }

    // Manager with no company yet — show the onboarding form
    return <OnboardingClient />;
}
