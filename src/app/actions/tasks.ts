'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateTaskStatus(taskId: string, status: string) {
    if (!taskId || !status) {
        return { error: 'taskId and status are required', data: null };
    }

    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: 'Unauthorized', data: null };
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Supabase update task error:', error);
        return { error: error.message, data: null };
    }

    revalidatePath(`/dashboard/projects`); // Revalidate for UI updates
    return { error: null, data };
}

export async function updateTaskPriority(taskId: string, priority: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from('tasks')
        .update({ priority })
        .eq('id', taskId)
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath(`/dashboard/projects`);
    return { success: true, data };
}

export async function getSubTasks(taskId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('task_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "public.task_subtasks" does not exist')) {
            return { error: 'Sub-tasks table not found. Please run the SQL schema in the implementation plan.', data: [] };
        }
        return { error: error.message, data: [] };
    }
    return { data };
}

export async function createSubTask(taskId: string, title: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from('task_subtasks')
        .insert({ task_id: taskId, title, completed: false })
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "public.task_subtasks" does not exist')) {
            return { error: 'Sub-tasks table not found. Please run the SQL schema in the implementation plan.' };
        }
        return { error: error.message };
    }
    return { success: true, data };
}

export async function toggleSubTask(subTaskId: string, completed: boolean) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('task_subtasks')
        .update({ completed })
        .eq('id', subTaskId);

    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "public.task_subtasks" does not exist')) {
            return { error: 'Sub-tasks table not found. Please run the SQL schema in the implementation plan.' };
        }
        return { error: error.message };
    }
    return { success: true };
}

export async function deleteSubTask(subTaskId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('task_subtasks')
        .delete()
        .eq('id', subTaskId);

    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "public.task_subtasks" does not exist')) {
            return { error: 'Sub-tasks table not found. Please run the SQL schema in the implementation plan.' };
        }
        return { error: error.message };
    }
    return { success: true };
}

export async function createProjectTask(taskData: any, assigneeId?: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const adminClient = createAdminClient();
    const { data: task, error: taskError } = await adminClient
        .from('tasks')
        .insert({
            ...taskData,
            created_by: user.id
        })
        .select()
        .single();

    if (taskError) return { error: taskError.message };

    if (assigneeId) {
        const { error: assignError } = await adminClient
            .from('task_assignees')
            .insert({
                task_id: task.id,
                user_id: assigneeId
            });
        if (assignError) console.error('Assignee error:', assignError);
    }

    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/tasks');
    return { success: true, data: task };
}

export async function getProjectStaff(projectId: string) {
    const adminClient = createAdminClient();
    const { data: staffData, error: staffError } = await adminClient
        .from('project_staff')
        .select(`
            staff_id,
            staffs:staff_id (
                id,
                full_name,
                user_id
            )
        `)
        .eq('project_id', projectId);

    if (staffError) return { error: staffError.message, data: [] };
    return { data: staffData?.map((s: any) => s.staffs) || [] };
}

export async function getProjectTasks(projectId: string) {
    const adminClient = createAdminClient();
    const { data: tasksData, error: tasksError } = await adminClient
        .from('tasks')
        .select(`
            *,
            task_assignees (
                user_id
            ),
            task_subtasks (
                id,
                title,
                completed
            )
        `)
        .eq('project_id', projectId);

    if (tasksError) {
        return { error: tasksError.message, data: [] };
    }

    return { data: tasksData || [] };
}
