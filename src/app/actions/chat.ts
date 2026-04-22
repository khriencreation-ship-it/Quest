'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { saveDocumentRecord } from './documents';

export type ChatMessage = {
    id: string;
    project_id: string;
    sender_id: string;
    sender_type: 'staff';
    content: string;
    document_id: string | null;
    created_at: string;
    sender_name?: string;
    document?: {
        file_name: string;
        file_url: string;
        file_type: string;
    };
};

/**
 * Fetch chat history for a project (Internal members only)
 */
export async function getProjectMessages(projectId: string): Promise<ChatMessage[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_messages')
        .select(`
            *,
            document:project_documents(file_name, file_url, file_type)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
    }

    // Resolve staff names
    const staffIds = [...new Set((data || []).map(m => m.sender_id))];
    let senderMap: Record<string, string> = {};

    if (staffIds.length > 0) {
        const { data: staffData } = await supabase
            .from('staffs')
            .select('user_id, full_name')
            .in('user_id', staffIds);
        staffData?.forEach(s => senderMap[s.user_id] = s.full_name);
    }

    return (data || []).map(msg => ({
        ...msg,
        sender_name: senderMap[msg.sender_id] || 'Unknown User'
    })) as ChatMessage[];
}

/**
 * Send a message (Project members only)
 */
export async function sendProjectMessage(input: {
    projectId: string;
    content: string;
    file?: {
        fileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
    }
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    let documentId = null;

    // If there's a file, save it to project_documents first
    if (input.file) {
        const docResult = await saveDocumentRecord({
            projectId: input.projectId,
            fileName: input.file.fileName,
            fileUrl: input.file.fileUrl,
            fileType: input.file.fileType,
            fileSize: input.file.fileSize
        });

        if (docResult.error) return { error: `Failed to save document: ${docResult.error}` };
        
        // Fetch the newly created document ID
        const { data: latestDoc } = await supabase
            .from('project_documents')
            .select('id')
            .eq('project_id', input.projectId)
            .eq('uploaded_by', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        documentId = latestDoc?.id;
    }

    const { error } = await supabase
        .from('project_messages')
        .insert({
            project_id: input.projectId,
            sender_id: user.id,
            sender_type: 'staff',
            content: input.content,
            document_id: documentId
        });

    if (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return { success: true };
}
