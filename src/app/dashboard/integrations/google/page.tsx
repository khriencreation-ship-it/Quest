import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import GoogleIntegrationClient from '@/components/dashboard/GoogleIntegrationClient';

export default async function GoogleIntegrationPage() {
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
    // Check if a Google integration already exists in the database
    const { data: integrationRaw, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('company_id', company.id)
        .eq('service_type', 'google')
        .single();

    const integration = integrationRaw ? {
        id: integrationRaw.id,
        account_email: integrationRaw.account_email,
        is_active: integrationRaw.is_active,
        scope_config: integrationRaw.scope_config,
        created_at: integrationRaw.created_at,
    } : null;
    if (error) {
        console.error('Error fetching integration:', error);
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <GoogleIntegrationClient integration={integration} company={company} />
        </div>
    );
}