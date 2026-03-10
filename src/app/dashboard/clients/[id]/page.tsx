import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import ClientDetailClient from '@/components/dashboard/ClientDetailClient';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Fetch the specific client ensuring they belong to the specific company
    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('company_id', company.id)
        .single();

    if (error || !client) {
        redirect('/dashboard/clients');
    }

    return (
        <div className="w-full">
            <ClientDetailClient client={client} />
        </div>
    );
}
