import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import ProjectsClient from '@/components/dashboard/ProjectsClient';

export default async function ProjectsPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Fetch projects with their relation data (organization names, client names, service names)
    // We use inner/left joins via Supabase string syntax
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            created_at,
            organization_id,
            client_id,
            is_internal,
            service_id,
            organizations(name),
            clients(name),
            services(name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

    // Fetch dropdown data for the create project modal
    const [organizationsResponse, clientsResponse, servicesResponse] = await Promise.all([
        supabase.from('organizations').select('id, name').eq('company_id', company.id).order('name'),
        supabase.from('clients').select('id, name').eq('company_id', company.id).order('name'),
        supabase.from('services').select('id, name').eq('company_id', company.id).order('name')
    ]);

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
                    <p className="text-gray-500">A high-level overview of active projects across your organizations.</p>
                </div>
            </div>
            {/* The ProjectsClient component will handle displaying the grid/list */}
            <ProjectsClient
                initialProjects={(projects as any) || []}
                organizations={organizationsResponse.data || []}
                clients={clientsResponse.data || []}
                services={servicesResponse.data || []}
            />
        </div>
    );
}
