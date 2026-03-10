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

    // Manager — check if onboarding has been completed (i.e. they have a company)
    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

    if (company) {
        // Onboarding already done — go straight to dashboard
        return NextResponse.json({ redirectTo: '/dashboard' });
    }

    // Manager with no company — needs to complete onboarding
    return NextResponse.json({ redirectTo: '/onboarding' });
}
