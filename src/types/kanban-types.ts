export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    assignees: string[]; // Names for display
    assignee_ids: string[]; // User IDs for logic
    attachments_count: number;
    comments_count: number;
    sub_tasks?: SubTask[];
    total_subtasks?: number;
    completed_subtasks?: number;
}
