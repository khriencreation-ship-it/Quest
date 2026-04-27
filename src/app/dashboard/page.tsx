import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import Link from 'next/link';
import { CheckSquare, Clock, FolderKanban, Users, LucideIcon } from 'lucide-react';

type activeStats = {
    label: string;
    value: string;
    icon: LucideIcon;
    trend: string;
}
export default async function DashboardHome(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
    const supabase = await createClient();
    const searchParams = await props.searchParams;
    const orgId = searchParams?.org;

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        redirect('/login');
    }

    const user = data.user;
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const isManager = user.user_metadata?.role === 'manager';

    let contextName = '';
    let company = null;

    if (orgId) {
        const adminSupabase = createAdminClient();
        const { data: org } = await adminSupabase.from('organizations').select('name').eq('id', orgId).single();
        contextName = org?.name || 'Unknown Organization';
    } else {
        company = await getCompany(user);

        if (!isManager && company) {
            const adminSupabase = createAdminClient();
            const { data: generalOrg } = await adminSupabase.from('organizations').select('id').eq('company_id', company.id).eq('name', 'General').single();
            if (generalOrg) {
                redirect(`/dashboard?org=${generalOrg.id}`);
            }
        }

        contextName = company?.name || 'Unknown Company';
    }

    // --- FETCH PERSONAL TASKS (For both Manager and Staff) ---
    const adminClient = createAdminClient();

    // 1. Fetch Project Tasks assigned to user
    const { data: assignedTaskIds } = await adminClient
        .from('task_assignees')
        .select('task_id')
        .eq('user_id', user.id);

    let myProjectTasks: any[] = [];
    if (assignedTaskIds && assignedTaskIds.length > 0) {
        const { data: pTasks } = await adminClient
            .from('tasks')
            .select('*, projects(name, organization_id)')
            .in('id', assignedTaskIds.map(a => a.task_id))
            .neq('status', 'done')
            .order('created_at', { ascending: false })
            .limit(5);
        myProjectTasks = pTasks || [];
    }

    // 2. Fetch Org Tasks assigned to user
    const { data: staffRec } = await adminClient
        .from('staffs')
        .select('id')
        .eq('user_id', user.id)
        .single();

    let myOrgTasks: any[] = [];
    if (staffRec) {
        const { data: orgAssignees } = await adminClient
            .from('org_task_assignees')
            .select('task_id')
            .eq('staff_id', staffRec.id);

        if (orgAssignees && orgAssignees.length > 0) {
            const { data: oTasks } = await adminClient
                .from('organization_tasks')
                .select('*, organizations(name)')
                .in('id', orgAssignees.map(a => a.task_id))
                .neq('status', 'done')
                .order('created_at', { ascending: false })
                .limit(5);
            myOrgTasks = oTasks || [];
        }
    }

    const myTasksCombined = [
        ...myProjectTasks.map(t => ({ ...t, type: 'Project', context: t.projects?.name })),
        ...myOrgTasks.map(t => ({ ...t, type: 'Internal', context: t.organizations?.name }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);


    let activeStats: activeStats[] = [];
    let recentProjects: any[] = [];
    let recentStaff: any[] = [];
    let recentOrganizations: any[] = [];

    if (orgId) {
        // --- ORGANIZATION VIEW ---
        const [
            { count: projectCount },
            { data: projectsData },
            { data: orgProjects }
        ] = await Promise.all([
            adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
            adminClient.from('projects').select('*, clients(name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
            adminClient.from('projects').select('id').eq('organization_id', orgId)
        ]);

        recentProjects = projectsData || [];
        const projectIds = orgProjects?.map(p => p.id) || [];

        let taskCount = 0;
        if (projectIds.length > 0) {
            const { count } = await adminClient
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .in('project_id', projectIds)
                .neq('status', 'done');
            taskCount = count || 0;
        }

        let documentCount = 0;
        if (projectIds.length > 0) {
            const { count } = await adminClient
                .from('project_documents')
                .select('*', { count: 'exact', head: true })
                .in('project_id', projectIds);
            documentCount = count || 0;
        }

        activeStats = [
            { label: 'Workspace Projects', value: (projectCount || 0).toString(), icon: FolderKanban, trend: 'Total projects' },
            { label: 'Active Tasks', value: (taskCount).toString(), icon: CheckSquare, trend: 'Work in progress' },
            { label: 'Documents', value: (documentCount).toString(), icon: Clock, trend: 'Files and docs' },
        ];
    } else {
        // --- COMPANY VIEW (Managers Only) ---
        if (company) {
            const [
                { count: orgCount },
                { count: projectCount },
                { count: clientCount },
                { count: staffCount },
                { data: topProjects },
                { data: topStaff },
                { data: topOrganizations }
            ] = await Promise.all([
                adminClient.from('organizations').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                adminClient.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                adminClient.from('clients').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                adminClient.from('staffs').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
                adminClient.from('projects').select('*, clients(name)').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
                adminClient.from('staffs').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5),
                adminClient.from('organizations').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(5)
            ]);

            recentProjects = topProjects || [];
            recentStaff = topStaff || [];
            recentOrganizations = topOrganizations || [];

            activeStats = [
                { label: 'Organizations', value: (orgCount || 0).toString(), icon: FolderKanban, trend: 'In your company' },
                { label: 'Total Projects', value: (projectCount || 0).toString(), icon: FolderKanban, trend: 'Total projects' },
                { label: 'Active Clients', value: (clientCount || 0).toString(), icon: Users, trend: 'Active clients' },
            ];
        }
    }

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2eb781]/10 text-[#2eb781] uppercase tracking-wider">
                    {contextName}
                </span>
            </div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">Welcome Back, {userName}</h1>
                <p className="text-gray-500 mt-1">
                    Here is what is happening with your {orgId ? 'workspace' : 'company'} today.
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8`}>
                {activeStats.map((stat: any, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-[#2eb781]/10 transition-colors">
                                <stat.icon className="w-5 h-5 text-gray-400 group-hover:text-[#2eb781]" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            {stat.trend}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: My Tasks */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-[#2eb781]" />
                                My Active Tasks
                            </h2>
                            <Link href="/dashboard/tasks" className="text-sm font-bold text-[#2eb781] hover:text-[#279e6f]">View All Tasks</Link>
                        </div>
                        <div className="p-2">
                            {myTasksCombined.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {myTasksCombined.map((task: any) => (
                                        <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors rounded-xl group/task">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.type === 'Project' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                            }`}>
                                                            {task.type}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate">{task.context}</span>
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 group-hover/task:text-[#2eb781] transition-colors">{task.title}</h3>
                                                    {task.due_date && (
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Due {new Date(task.due_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <CheckSquare className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">All caught up!</h3>
                                    <p className="text-sm text-gray-500 mt-1">You don't have any active tasks assigned to you right now.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Workspace/Company Projects View */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                {orgId ? 'Workspace Projects' : 'Company Overview'}
                            </h2>
                            <Link href="/dashboard/projects" className="text-sm font-bold text-[#2eb781] hover:text-[#279e6f]">View All</Link>
                        </div>
                        <div className="p-6">
                            {recentProjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recentProjects.map((project: any) => (
                                        <Link
                                            key={project.id}
                                            href={`/dashboard/projects/${project.id}`}
                                            className="p-4 border border-gray-100 rounded-2xl bg-white hover:border-[#2eb781] hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#2eb781]/10 transition-colors`}>
                                                    <FolderKanban className="w-5 h-5 text-gray-400 group-hover:text-[#2eb781]" />
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-[#2eb781] truncate">{project.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1 mb-4">{project.clients?.name || 'Internal'}</p>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-[10px] text-gray-400 font-bold uppercase">
                                                <span>Active</span>
                                                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                    <p className="text-sm text-gray-500">No active projects to display in this context.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Context Information */}
                <div className="lg:col-span-4 space-y-8">
                    {!orgId && isManager ? (
                        <>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-md font-bold text-gray-900">Top Organizations</h2>
                                    <Link href="/dashboard/organizations" className="text-xs font-bold text-[#2eb781]">View All</Link>
                                </div>
                                <div className="space-y-4">
                                    {recentOrganizations.map((org: any) => (
                                        <Link key={org.id} href={`/dashboard?org=${org.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors group">
                                            <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#2eb781] transition-colors">
                                                {org.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{org.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Workspace</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-md font-bold text-gray-900">Recent Activity</h2>
                                    <Link href="/dashboard/staffs" className="text-xs font-bold text-[#2eb781]">Team</Link>
                                </div>
                                <div className="space-y-4">
                                    {recentStaff.map((staff: any) => (
                                        <div key={staff.id} className="flex items-center gap-3 p-2">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                                {staff.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{staff.full_name}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{staff.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#2eb781] rounded-3xl p-8 text-white shadow-xl shadow-[#2eb781]/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                                <p className="text-emerald-50 text-sm leading-relaxed mb-6 opacity-90">
                                    If you have questions about your assigned tasks or project deadlines, contact your manager or the project lead.
                                </p>
                                <button className="w-full py-3 bg-white text-[#2eb781] rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors">
                                    View Documentation
                                </button>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
