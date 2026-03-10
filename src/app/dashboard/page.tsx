import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';

export default async function DashboardHome(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
    const supabase = await createClient();
    const searchParams = await props.searchParams;
    const orgId = searchParams?.org;

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect('/login');
    }

    const user = data.user;
    // We didn't collect a full name during seed/onboarding, so we fallback to email prefix for now
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    let contextName = '';

    if (orgId) {
        const adminSupabase = createAdminClient();
        const { data: org } = await adminSupabase.from('organizations').select('name').eq('id', orgId).single();
        contextName = org?.name || 'Unknown Organization';
    } else {
        const company = await getCompany(user);

        // If they are not a manager, they should not see the company wide dashboard.
        if (user.user_metadata?.role !== 'manager' && company) {
            const adminSupabase = createAdminClient();
            const { data: generalOrg } = await adminSupabase.from('organizations').select('id').eq('company_id', company.id).eq('name', 'General').single();
            if (generalOrg) {
                redirect(`/dashboard?org=${generalOrg.id}`);
            }
        }

        contextName = company?.name || 'Unknown Company';
    }

    // Placeholder stats based on context
    const companyStats = [
        { label: 'Organizations', value: '3', trend: '+1 this month' },
        { label: 'Total Projects', value: '24', trend: '+5 this month' },
        { label: 'Active Clients', value: '18', trend: '2 new this week' },
        { label: 'Total Staff', value: '42', trend: '+3 this month' },
        { label: 'Active Services', value: '15', trend: 'Running smoothly' },
        { label: 'Integrations', value: '4', trend: 'All systems operational' },
    ];

    const orgStats = [
        { label: 'Total Projects', value: '7', trend: '1 completed this week' },
        { label: 'Active Tasks', value: '14', trend: '3 due today' },
        { label: 'Documents', value: '128', trend: '+15 this week' },
    ];

    const activeStats = orgId ? orgStats : companyStats;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2eb781]/10 text-[#2eb781] uppercase tracking-wider">
                    {contextName}
                </span>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back, {userName}</h1>
                <p className="text-gray-500 mt-1">
                    Here is what is happening with your {orgId ? 'workspace' : 'company'} today.
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8`}>
                {activeStats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                        <div className="flex items-baseline gap-3 mt-2">
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <p className="text-sm text-[#2eb781] mt-2 font-medium flex items-center gap-1">
                            {stat.trend}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            {!orgId ? (
                // --- COMPANY WORKSPACE VIEW ---
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Projects & Clients Summary */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Recent Projects</h2>
                            <button className="text-sm font-medium text-[#2eb781] hover:text-[#279e6f]">View All</button>
                        </div>
                        <div className="flex-1 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center p-6 text-center">
                            <p className="text-gray-500 text-sm">No recent projects to display. Projects created across organizations will appear here.</p>
                        </div>
                    </div>

                    {/* Staff & Roles Snapshot */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Team Activity</h2>
                            <button className="text-sm font-medium text-[#2eb781] hover:text-[#279e6f]">Manage Staff</button>
                        </div>
                        <div className="flex-1 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center p-6 text-center">
                            <p className="text-gray-500 text-sm">Invite staff and assign roles to see their recent activity here.</p>
                        </div>
                    </div>

                    {/* Full Width Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Company Overview</h2>
                        </div>
                        <div className="h-[200px] border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center p-6 text-center">
                            <p className="text-gray-500 text-sm">A centralized dashboard for cross-organization metrics will be populated here.</p>
                        </div>
                    </div>
                </div>
            ) : (
                // --- ORGANIZATION WORKSPACE VIEW ---
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Workspace Activity</h2>
                    </div>
                    <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-gray-500 text-sm">Create projects or assign tasks to start tracking activity in this workspace.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
