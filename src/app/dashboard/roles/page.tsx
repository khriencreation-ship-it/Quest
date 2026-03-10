import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import RolesClient from '@/components/dashboard/RolesClient';

export default async function RolesPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        redirect('/login');
    }

    // Get the user's company
    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Fetch all roles for this company
    const { data: roles } = await supabase
        .from('roles')
        .select('id, name, description, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <RolesClient roles={roles || []} />
        </div>
    );
}
