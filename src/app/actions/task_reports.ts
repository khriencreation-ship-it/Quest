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
        const adminClient = createAdminClient();
        const { data: staffData } = await adminClient
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

    // Notify task creator and department manager
    try {
        const adminClient = createAdminClient();
        const { data: task } = await adminClient
            .from('tasks')
            .select('title, created_by, projects(organization_id)')
            .eq('id', taskId)
            .maybeSingle();

        // If not found in projects table, try organization_tasks
        let orgId = (task as any)?.projects?.organization_id;
        let creatorId = task?.created_by;
        let taskTitle = task?.title;

        if (!task) {
            const { data: oTask } = await adminClient
                .from('organization_tasks')
                .select('title, created_by, organization_id')
                .eq('id', taskId)
                .maybeSingle();
            
            if (oTask) {
                orgId = oTask.organization_id;
                creatorId = oTask.created_by;
                taskTitle = oTask.title;
            }
        }

        if (creatorId && creatorId !== user.id) {
            const senderName = user.user_metadata?.full_name || "A team member";
            const { createNotification } = await import("./notifications");
            
            await createNotification(
                creatorId,
                "New Task Report",
                `${senderName} added a report on: ${taskTitle || "a task"}`,
                "task_report",
                `/dashboard/tasks/${taskId}${orgId ? `?org=${orgId}` : ''}`
              );
        }
    } catch (notifyError) {
        console.error("Failed to send report notification:", notifyError);
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: true };
}
