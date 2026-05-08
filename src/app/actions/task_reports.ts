'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export type TaskReport = {
    id: string;
    task_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender_name?: string;
};

/**
 * Fetch progress reports/comments for a task
 */
export async function getTaskReports(taskId: string): Promise<TaskReport[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('task_reports')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching task reports:', error);
        return [];
    }

    // Resolve sender names from staffs table
    const senderIds = [...new Set((data || []).map(m => m.sender_id))];
    let senderMap: Record<string, string> = {};

    if (senderIds.length > 0) {
        const { data: staffData } = await supabase
            .from('staffs')
            .select('user_id, full_name')
            .in('user_id', senderIds);
        staffData?.forEach(s => senderMap[s.user_id] = s.full_name);
    }

    return (data || []).map(msg => ({
        ...msg,
        sender_name: senderMap[msg.sender_id] || 'Unknown User'
    })) as TaskReport[];
}

/**
 * Add a progress report/comment
 */
export async function addTaskReport(taskId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('task_reports')
        .insert({
            task_id: taskId,
            sender_id: user.id,
            content: content
        });

    if (error) {
        console.error('Error adding task report:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: true };
}
