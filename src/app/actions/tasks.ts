'use server';

import { createClient } from '@/utils/supabase/server';
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { error } = await supabase
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

    const { error } = await supabase
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
