'use server';

import { createClient } from '@/utils/supabase/server';

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

    return { error: null, data };
}
