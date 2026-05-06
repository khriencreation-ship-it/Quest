import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import TasksClient from '@/components/dashboard/TasksClient';

export default async function TasksPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    const isManager = userData.user.user_metadata?.role === 'manager';
    let allowedOrgIds: string[] = [];

    // If staff, we must determine which organizations they belong to
    if (!isManager) {
        const adminSupabase = createAdminClient();
        const { data: staffRec } = await adminSupabase
            .from('staffs')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('company_id', company.id)
            .single();

        if (staffRec) {
            // 1. Memberships
            const { data: memberOrgs } = await adminSupabase
                .from('organization_members')
                .select('organization_id')
                .eq('staff_id', staffRec.id);
            const membershipIds = (memberOrgs || []).map((m: any) => m.organization_id);

            // 2. Project Task Assignments (including collaborations)
            const { data: projectTasks } = await adminSupabase
                .from('task_assignees')
                .select('task_id')
                .eq('user_id', userData.user.id);
            const pTaskIds = (projectTasks || []).map((pt) => pt.task_id);

            let projectOrgIds: string[] = [];
            if (pTaskIds.length > 0) {
                const { data: projects } = await adminSupabase
                    .from('tasks')
                    .select('projects(organization_id)')
                    .in('id', pTaskIds);
                projectOrgIds = (projects || [])
                    .map((p: any) => p.projects?.organization_id)
                    .filter(Boolean);
            }

            // 3. Org Task Assignments
            const { data: orgTasks } = await adminSupabase
                .from('org_task_assignees')
                .select('task_id')
                .eq('staff_id', staffRec.id);
            const oTaskIds = (orgTasks || []).map((ot) => ot.task_id);

            let orgTaskOrgIds: string[] = [];
            if (oTaskIds.length > 0) {
                const { data: oTasks } = await adminSupabase
                    .from('organization_tasks')
                    .select('organization_id')
                    .in('id', oTaskIds);
                orgTaskOrgIds = (oTasks || [])
                    .map((ot) => ot.organization_id)
                    .filter(Boolean);
            }

            allowedOrgIds = Array.from(
                new Set([...membershipIds, ...projectOrgIds, ...orgTaskOrgIds])
            );
        }

        const { data: generalOrg } = await adminSupabase
            .from('organizations')
            .select('id')
            .eq('company_id', company.id)
            .eq('name', 'General')
            .single();

        if (generalOrg && !allowedOrgIds.includes(generalOrg.id)) {
            allowedOrgIds.push(generalOrg.id);
        }
    }

    const adminSupabase = createAdminClient();

    // Fetch Organizational Tasks
    let tasksQuery = adminSupabase
        .from('organization_tasks')
        .select(`
            id,
            title,
            description,
            due_date,
            status,
            created_at,
            created_by,
            organization_id,
            org_task_assignees(
                staffs(id, full_name, email)
            ),
            org_task_attachments(id)
        `)
        .eq('company_id', company.id);

    if (!isManager) {
        if (allowedOrgIds.length > 0) {
            tasksQuery = tasksQuery.in('organization_id', allowedOrgIds);
        } else {
            tasksQuery = tasksQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000');
        }
    }

    const { data: tasks } = await tasksQuery.order('created_at', { ascending: false });

    // Fetch Project Tasks
    let pTasksQuery = adminSupabase
        .from('tasks')
        .select(`
            *,
            projects!inner(organization_id, name),
            task_assignees(user_id)
        `)
        .eq('company_id', company.id);

    if (!isManager) {
        if (allowedOrgIds.length > 0) {
            pTasksQuery = pTasksQuery.in('projects.organization_id', allowedOrgIds);
        } else {
            pTasksQuery = pTasksQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
    }

    const { data: pTasks } = await pTasksQuery.order('created_at', { ascending: false });

    // Fetch all staff for name mapping on project tasks
    const { data: allStaff } = await adminSupabase
        .from('staffs')
        .select('id, user_id, full_name, email')
        .eq('company_id', company.id);

    const staffByUserId = (allStaff || []).reduce((acc: any, s: any) => {
        if (s.user_id) acc[s.user_id] = s;
        return acc;
    }, {});

    // Normalize Project Tasks to a format TasksClient can ingest
    const normalizedPTasks = (pTasks || []).map((t: any) => ({
        ...t,
        organization_id: t.projects?.organization_id,
        is_project_task: true,
        project_name: t.projects?.name,
        // Map project task assignees to the structure expected by TasksClient (staffRelation)
        org_task_assignees: t.task_assignees?.map((a: any) => ({
            staffs: staffByUserId[a.user_id] || { full_name: 'Unknown', id: a.user_id, email: '' }
        })) || []
    }));

    // Fetch Organizations
    let orgsQuery = adminSupabase
        .from('organizations')
        .select('id, name')
        .eq('company_id', company.id);

    if (!isManager) {
        if (allowedOrgIds.length > 0) {
            orgsQuery = orgsQuery.in('id', allowedOrgIds);
        } else {
            orgsQuery = orgsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
    }

    const { data: organizationsResponse } = await orgsQuery.order('name');

    const combinedTasks = [...(tasks || []), ...normalizedPTasks];

    return (
        <div className="w-full h-[calc(100vh-6rem)]">
            <TasksClient
                initialTasks={combinedTasks as any[]}
                organizations={organizationsResponse || []}
            />
        </div>
    );
}
