import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import ClientsClient from '@/components/dashboard/ClientsClient';

export default async function ClientsPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Fetch clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <p className="text-gray-500">Manage your company's clients and their portals.</p>
                </div>
            </div>
            <ClientsClient initialClients={clients || []} companyId={company.id} />
        </div>
    );
}
