import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import Link from 'next/link';
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
    let company = null;

    if (orgId) {
        const adminSupabase = createAdminClient();
        const { data: org } = await adminSupabase.from('organizations').select('name').eq('id', orgId).single();
        contextName = org?.name || 'Unknown Organization';
    } else {
        company = await getCompany(user);

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

    let companyStats = [
        { label: 'Organizations', value: '0', trend: 'In your company' },
        { label: 'Total Projects', value: '0', trend: 'Total projects' },
        { label: 'Active Clients', value: '0', trend: 'Active clients' },
        { label: 'Total Staff', value: '0', trend: 'Registered staff' },
        { label: 'Active Services', value: '0', trend: 'Available services' },
        { label: 'Integrations', value: '0', trend: 'All systems operational' },
    ];

    let orgStats = [
        { label: 'Total Projects', value: '0', trend: 'Total projects' },
        { label: 'Active Tasks', value: '0', trend: 'Work in progress' },
        { label: 'Documents', value: '0', trend: 'Files and docs' },
    ];

    let recentProjects: any[] = [];
    let recentStaff: any[] = [];
    let recentOrganizations: any[] = [];

    if (orgId) {
        // Fetch org-specific stats
        const { count: projectCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);

        // Fetch recent projects for this org
        const { data: projectsData } = await supabase
            .from('projects')
            .select('*, clients(name)')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(5);

        recentProjects = projectsData || [];

        // Fetch projects for this organization to get their IDs
        const { data: orgProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('organization_id', orgId);
        
        const projectIds = orgProjects?.map(p => p.id) || [];

        // 1. Count ALL tasks for this organization (total count for simplicity, or exclude 'done' for 'active')
        let taskCount = 0;
        if (projectIds.length > 0) {
            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .in('project_id', projectIds)
                .neq('status', 'done'); // Only 'active' tasks
            taskCount = count || 0;
        }

        // 2. Count Documents for this organization
        let documentCount = 0;
        if (projectIds.length > 0) {
            const { count } = await supabase
                .from('project_documents')
                .select('*', { count: 'exact', head: true })
                .in('project_id', projectIds);
            documentCount = count || 0;
        }

        orgStats = [
            { label: 'Total Projects', value: (projectCount || 0).toString(), trend: 'Total projects' },
            { label: 'Active Tasks', value: (taskCount).toString(), trend: 'Work in progress' },
            { label: 'Documents', value: (documentCount).toString(), trend: 'Files and docs' },
        ];
    } else {
        // Fetch company-specific stats
        if (company) {
            const [
                { count: orgCount },
                { count: projectCount },
                { count: clientCount },
                { count: staffCount },
                { count: taskCount },
                { count: documentCount },
                { data: topProjects },
                { data: topStaff },
                { data: topOrganizations }
            ] = await Promise.all([
                supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                supabase.from('staffs').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', company.id).neq('status', 'done'),
                supabase.from('project_documents').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                // Fetch latest lists
                supabase.from('projects').select('*, clients(name)').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('staffs').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('organizations').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5)
            ]);

            recentProjects = topProjects || [];
            recentStaff = topStaff || [];
            recentOrganizations = topOrganizations || [];

            companyStats = [
                { label: 'Organizations', value: (orgCount || 0).toString(), trend: 'In your company' },
                { label: 'Total Projects', value: (projectCount || 0).toString(), trend: 'Total projects' },
                { label: 'Active Clients', value: (clientCount || 0).toString(), trend: 'Active clients' },
                { label: 'Total Staff', value: (staffCount || 0).toString(), trend: 'Registered staff' },
                { label: 'Total Tasks', value: (taskCount || 0).toString(), trend: 'Across all projects' },
                { label: 'Documents', value: (documentCount || 0).toString(), trend: 'Global file count' },
            ];
        }
    }

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
                            <Link href="/dashboard/projects" className="text-sm font-medium text-[#2eb781] hover:text-[#279e6f]">View All</Link>
                        </div>
                        {recentProjects.length > 0 ? (
                            <div className="flex-1 overflow-y-auto pr-2">
                                <ul className="space-y-4">
                                    {recentProjects.map((project: any) => (
                                        <li key={project.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{project.clients?.name || 'Internal / No Client'}</p>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 capitalize">
                                                {project.status.replace('_', ' ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex-1 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center p-6 text-center">
                                <p className="text-gray-500 text-sm">No recent projects to display. Projects created across organizations will appear here.</p>
                            </div>
                        )}
                    </div>

                    {/* Staff & Roles Snapshot */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Team Activity</h2>
                            <Link href="/dashboard/staffs" className="text-sm font-medium text-[#2eb781] hover:text-[#279e6f]">Manage Staff</Link>
                        </div>
                        {recentStaff.length > 0 ? (
                            <div className="flex-1 overflow-y-auto pr-2">
                                <ul className="space-y-4">
                                    {recentStaff.map((staff: any) => (
                                        <li key={staff.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                            <div className="h-8 w-8 rounded-full bg-[#2eb781]/10 flex items-center justify-center text-[#2eb781] font-bold text-xs ring-2 ring-white">
                                                {staff.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{staff.full_name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5" title={staff.email}>{staff.email.length > 28 ? staff.email.substring(0, 25) + '...' : staff.email}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex-1 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center p-6 text-center">
                                <p className="text-gray-500 text-sm">Invite staff and assign roles to see their recent activity here.</p>
                            </div>
                        )}
                    </div>

                    {/* Full Width Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Company Overview: Open Organizations</h2>
                            <Link href="/dashboard/organizations" className="text-sm font-medium text-[#2eb781] hover:text-[#279e6f]">View Organizations</Link>
                        </div>
                        {recentOrganizations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentOrganizations.map((org: any) => (
                                    <div key={org.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors">
                                        <h3 className="font-semibold text-gray-900 text-sm">{org.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{org.description || 'No description provided'}</p>
                                        <p className="text-[10px] text-gray-400 mt-4">Created {new Date(org.created_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center p-6 text-center">
                                <p className="text-gray-500 text-sm">A centralized dashboard for cross-organization metrics will be populated here.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // --- ORGANIZATION WORKSPACE VIEW ---
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Workspace Activity (Recent Projects)</h2>
                    </div>
                    {recentProjects.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentProjects.map((project: any) => (
                                        <tr key={project.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.clients?.name || 'Internal'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 capitalize">
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{new Date(project.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-gray-500 text-sm">Create projects or assign tasks to start tracking activity in this workspace.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
