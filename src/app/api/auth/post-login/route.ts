import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    // Not authenticated — send to login
    if (error || !data?.user) {
        return NextResponse.json({ redirectTo: '/login' });
    }

    const user = data.user;
    const role = user.user_metadata?.role;

    // Regular user (no manager role) — skip onboarding, go to dashboard
    if (role !== 'manager') {
        return NextResponse.json({ redirectTo: '/dashboard' });
    }

    // Manager — check if they are part of a company
    const { getCompany } = await import('@/utils/getCompany');
    const company = await getCompany(user);

    if (company) {
        // Onboarding already done (or they are invited) — go straight to dashboard
        console.log('[Auth] Manager found in company (id:', company.id, ') — redirecting to dashboard');
        return NextResponse.json({ redirectTo: '/dashboard' });
    }

    // Manager with no company — needs to complete onboarding
    console.log('[Auth] Manager with no company found — redirecting to onboarding');
    return NextResponse.json({ redirectTo: '/onboarding' });
}
