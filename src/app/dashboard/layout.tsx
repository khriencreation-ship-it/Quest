import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import DashboardSidebar from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect('/login');
    }

    // Fetch the company this user belongs to
    const company = await getCompany(data.user);

    // If no company exists, evaluate role to redirect
    if (!company) {
        if (data.user.user_metadata?.role === 'manager') {
            redirect('/onboarding');
        } else {
            redirect('/unauthorized');
        }
    }

    // Fetch organizations
    const isManager = data.user.user_metadata?.role === 'manager';
    let organizations;

    if (isManager) {
        const { data: allOrgs } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('company_id', company.id)
            .order('created_at', { ascending: true });
        organizations = allOrgs;
    } else {
        const adminSupabase = createAdminClient();
        // Staff members see "General" + any organization they are in `organization_members` for
        const { data: staffRec } = await adminSupabase.from('staffs').select('id').eq('user_id', data.user.id).eq('company_id', company.id).single();

        let allowedOrgIds: string[] = [];
        if (staffRec) {
            const { data: memberOrgs } = await adminSupabase.from('organization_members').select('organization_id').eq('staff_id', staffRec.id);
            allowedOrgIds = (memberOrgs || []).map((m: any) => m.organization_id);
        }

        let query = adminSupabase.from('organizations').select('id, name').eq('company_id', company.id);
        if (allowedOrgIds.length > 0) {
            query = query.or(`name.eq.General,id.in.(${allowedOrgIds.join(',')})`);
        } else {
            query = query.eq('name', 'General');
        }

        const { data: staffOrgs } = await query.order('created_at', { ascending: true });
        organizations = staffOrgs;
    }

    // Make sure "General" is always the first organization
    const orgList = (organizations || []).sort((a, b) => {
        if (a.name === 'General') return -1;
        if (b.name === 'General') return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="min-h-screen bg-gray-50 flex selection:bg-[#2eb781]/30 selection:text-gray-900">

            <DashboardSidebar company={company} organizations={orgList} isManager={isManager} />

            {/* Main Content */}
            <main className="flex-1 ml-64 md:ml-[352px] flex flex-col min-h-screen overflow-x-hidden">
                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
