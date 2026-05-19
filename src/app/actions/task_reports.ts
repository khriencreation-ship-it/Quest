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

    // Notify task creator, department manager, mentioned users, and referenced subtask assignees
    try {
        const adminClient = createAdminClient();
        
        // 1. Fetch task info with assignees
        const { data: task } = await adminClient
            .from('tasks')
            .select('title, created_by, project_id, projects(organization_id), task_assignees(user_id)')
            .eq('id', taskId)
            .maybeSingle();

        let orgId = (task as any)?.projects?.organization_id;
        let projectId = task?.project_id;
        let creatorId = task?.created_by;
        let taskTitle = task?.title;
        let assigneeIds = (task as any)?.task_assignees?.map((a: any) => a.user_id) || [];

        if (!task) {
            // Check organization_tasks
            const { data: oTask } = await adminClient
                .from('organization_tasks')
                .select('title, created_by, organization_id, org_task_assignees(staff_id)')
                .eq('id', taskId)
                .maybeSingle();
            
            if (oTask) {
                orgId = oTask.organization_id;
                creatorId = oTask.created_by;
                taskTitle = oTask.title;
                const staffIds = (oTask as any)?.org_task_assignees?.map((a: any) => a.staff_id) || [];
                if (staffIds.length > 0) {
                    const { data: staffs } = await adminClient
                        .from('staffs')
                        .select('user_id')
                        .in('id', staffIds);
                    assigneeIds = staffs?.map((s: any) => s.user_id).filter(Boolean) || [];
                }
            }
        }

        const senderName = user.user_metadata?.full_name || "A team member";
        const { createNotification } = await import("./notifications");

        const taskLink = projectId 
            ? `/dashboard/projects/${projectId}?tab=tasks${orgId ? `&org=${orgId}` : ''}`
            : `/dashboard/tasks/${taskId}${orgId ? `?org=${orgId}` : ''}`;

        // Set to collect all user IDs to avoid duplicate notifications to the same user
        const notifiedUsers = new Set<string>();

        // Never notify the sender themselves
        notifiedUsers.add(user.id);

        // A. Notify Task Creator
        if (creatorId && !notifiedUsers.has(creatorId)) {
            await createNotification(
                creatorId,
                "New Task Report",
                `${senderName} added a report on: ${taskTitle || "a task"}`,
                "task_report",
                taskLink
            );
            notifiedUsers.add(creatorId);
        }

        // B. Notify Mentioned Users (@)
        const userMentionRegex = /<span[^>]*data-type="mention"[^>]*data-id="([^"]+)"[^>]*>/g;
        const mentionedUserIds = Array.from(content.matchAll(userMentionRegex)).map(m => m[1]);
        
        for (const mentionedId of mentionedUserIds) {
            if (mentionedId && !notifiedUsers.has(mentionedId)) {
                await createNotification(
                    mentionedId,
                    "Mentioned in Task Report",
                    `${senderName} mentioned you in a report on: ${taskTitle || "a task"}`,
                    "task_mention",
                    taskLink
                );
                notifiedUsers.add(mentionedId);
            }
        }

        // C. Notify Assignees of Referenced Subtasks (#)
        const subtaskMentionRegex = /<span[^>]*data-type="subtask"[^>]*data-id="([^"]+)"[^>]*>/g;
        const referencedSubtaskIds = Array.from(content.matchAll(subtaskMentionRegex)).map(m => m[1]);

        if (referencedSubtaskIds.length > 0) {
            // Fetch subtask titles
            const { data: subtasks } = await adminClient
                .from('task_subtasks')
                .select('title')
                .in('id', referencedSubtaskIds);
            
            const subtaskTitles = subtasks?.map((s: any) => s.title).join(", ") || "a subtask";

            // Notify all task assignees who haven't been notified yet
            for (const assigneeId of assigneeIds) {
                if (assigneeId && !notifiedUsers.has(assigneeId)) {
                    await createNotification(
                        assigneeId,
                        "Subtask Referenced in Report",
                        `${senderName} referenced subtask "${subtaskTitles}" in a report on: ${taskTitle || "a task"}`,
                        "subtask_reference",
                        taskLink
                    );
                    notifiedUsers.add(assigneeId);
                }
            }
        }
    } catch (notifyError) {
        console.error("Failed to send report notification:", notifyError);
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: true };
}
