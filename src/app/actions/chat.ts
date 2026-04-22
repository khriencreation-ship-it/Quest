'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import { saveDocumentRecord } from './documents';

export type ChatMessage = {
    id: string;
    project_id: string;
    sender_id: string;
    sender_type: 'staff' | 'client';
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
 * Fetch chat history for a project
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

    // Resolve sender names
    const staffIds = data.filter(m => m.sender_type === 'staff').map(m => m.sender_id);
    const clientIds = data.filter(m => m.sender_type === 'client').map(m => m.sender_id);

    let senderMap: Record<string, string> = {};

    if (staffIds.length > 0) {
        const { data: staffData } = await supabase
            .from('staffs')
            .select('user_id, full_name')
            .in('user_id', staffIds);
        staffData?.forEach(s => senderMap[s.user_id] = s.full_name);
    }

    if (clientIds.length > 0) {
        const { data: clientData } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', clientIds);
        clientData?.forEach(c => senderMap[c.id] = c.name);
    }

    return (data || []).map(msg => ({
        ...msg,
        sender_name: senderMap[msg.sender_id] || 'Unknown User'
    }));
}

/**
 * Send a message (Staff context)
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
        
        // We need the ID of the newly created document
        // Since saveDocumentRecord doesn't return it currently, we fetch the latest for this user/project
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

/**
 * Send a message (Portal context - using portal_token)
 */
export async function sendPortalMessage(input: {
    projectId: string;
    portalToken: string;
    content: string;
    file?: {
        fileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
    }
}) {
    const adminSupabase = createAdminClient();

    // Verify token and get client info
    const { data: client, error: clientError } = await adminSupabase
        .from('clients')
        .select('id, company_id')
        .eq('portal_token', input.portalToken)
        .single();

    if (clientError || !client) return { error: 'Invalid portal token' };

    let documentId = null;

    // If there's a file, save to documents using admin client (portal users don't have auth)
    if (input.file) {
        const { data: newDoc, error: docError } = await adminSupabase
            .from('project_documents')
            .insert({
                project_id: input.projectId,
                company_id: client.company_id,
                file_name: input.file.fileName,
                file_url: input.file.fileUrl,
                file_type: input.file.fileType,
                file_size: input.file.fileSize,
                uploaded_by: null // Uploaded by portal client
            })
            .select()
            .single();

        if (docError) return { error: `Failed to save document: ${docError.message}` };
        documentId = newDoc.id;
    }

    const { error } = await adminSupabase
        .from('project_messages')
        .insert({
            project_id: input.projectId,
            sender_id: client.id,
            sender_type: 'client',
            content: input.content,
            document_id: documentId
        });

    if (error) {
        console.error('Error sending portal message:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return { success: true };
}
