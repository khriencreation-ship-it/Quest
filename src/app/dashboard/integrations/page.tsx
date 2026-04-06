import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import IntegrationsClient from '@/components/dashboard/IntegrationsClient';

export default async function IntegrationsPage() {
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

    // Fetch active integrations
    const { data: integrationsData } = await supabase
        .from('integrations')
        .select('service_type')
        .eq('company_id', company.id)
        .eq('is_active', true);

    const activeIntegrations = integrationsData?.map(i => i.service_type) || [];

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <IntegrationsClient activeIntegrations={activeIntegrations} />
        </div>
    );
}
