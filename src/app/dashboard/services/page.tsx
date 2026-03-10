import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import { seedCompanyServices } from '@/app/actions/services';
import ServicesClient from '@/components/dashboard/ServicesClient';

export default async function ServicesPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Auto-seed the 6 services if this company has none yet
    const { count } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id);

    if (!count || count === 0) {
        await seedCompanyServices(company.id);
    }

    // Fetch all services for this company
    const { data: services } = await supabase
        .from('services')
        .select('id, name, description, service_type, scope_config, is_active, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });

    return (
        <ServicesClient services={services || []} />
    );
}
