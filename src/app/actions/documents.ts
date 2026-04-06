'use server';

import { createClient } from '@/utils/supabase/server';
import { getCompany } from '@/utils/getCompany';
import { revalidatePath } from 'next/cache';

export type ProjectDocument = {
    id: string;
    project_id: string;
    company_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number | null;
    uploaded_by: string | null;
    created_at: string;
    uploader_name?: string;
};

/**
 * Fetch all documents for a given project.
 */
export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project documents:', error);
        throw error;
    }

    // Fetch uploader names for all documents
    const uploaderIds = [...new Set((data || []).map(d => d.uploaded_by).filter(Boolean))];
    let uploaderMap: Record<string, string> = {};

    if (uploaderIds.length > 0) {
        const { data: staffData } = await supabase
            .from('staffs')
            .select('user_id, full_name')
            .in('user_id', uploaderIds);

        if (staffData) {
            uploaderMap = Object.fromEntries(
                staffData.map(s => [s.user_id, s.full_name])
            );
        }
    }

    return (data || []).map(doc => ({
        ...doc,
        uploader_name: doc.uploaded_by ? uploaderMap[doc.uploaded_by] || 'Unknown' : 'Unknown',
    }));
}

/**
 * Save a document record after the client has uploaded the file to Supabase Storage.
 */
export async function saveDocumentRecord(input: {
    projectId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
}) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const company = await getCompany(user);
    if (!company) return { error: 'No company found' };

    const { error } = await supabase
        .from('project_documents')
        .insert({
            project_id: input.projectId,
            company_id: company.id,
            file_name: input.fileName,
            file_url: input.fileUrl,
            file_type: input.fileType,
            file_size: input.fileSize,
            uploaded_by: user.id,
        });

    if (error) {
        console.error('Error saving document record:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    return { success: true };
}

/**
 * Delete a document (removes storage file + DB record).
 */
export async function deleteDocument(documentId: string, storagePath: string, projectId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    // Delete from storage
    const { error: storageError } = await supabase
        .storage
        .from('project-documents')
        .remove([storagePath]);

    if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue to delete DB record even if storage deletion fails
    }

    // Delete DB record
    const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId);

    if (dbError) {
        console.error('Error deleting document record:', dbError);
        return { error: dbError.message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

/**
 * Update a document's display name in the database.
 */
export async function updateDocumentName(documentId: string, newName: string, projectId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('project_documents')
        .update({ file_name: newName })
        .eq('id', documentId);

    if (error) {
        console.error('Error updating document name:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}
