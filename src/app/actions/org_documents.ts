'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain'
];

export async function uploadOrgDocument(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const organizationId = formData.get('organization_id') as string;
        const category = formData.get('category') as string;

        if (!file || !organizationId || !category) {
            return { error: 'Missing required fields' };
        }

        if (file.size > MAX_FILE_SIZE) {
            return { error: 'File size exceeds 50MB limit' };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { error: 'File type not supported' };
        }

        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { error: 'Unauthorized' };

        // 2. Fetch company ID internally for safety
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('company_id')
            .eq('id', organizationId)
            .single();

        if (orgError || !org) return { error: 'Organization not found' };

        // 4. Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${org.company_id}/${organizationId}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('org_documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        // 5. Save metadata to DB (Store Path, not public URL)
        const { error: dbError } = await supabase
            .from('organization_documents')
            .insert({
                company_id: org.company_id,
                organization_id: organizationId,
                file_name: file.name,
                file_url: uploadData.path,
                file_type: file.type,
                file_size: file.size,
                category,
                uploaded_by: user.id
            });

        if (dbError) {
            await supabase.storage.from('org_documents').remove([filePath]);
            throw new Error(`DB insert failed: ${dbError.message}`);
        }

        revalidatePath('/dashboard/documents');
        return { success: true };
    } catch (error: any) {
        console.error('Document upload error:', error);
        return { error: error.message || 'Failed to upload document' };
    }
}

export async function deleteOrgDocument(documentId: string, fileUrl: string) {
    try {
        const supabase = await createClient();

        // 1. Delete from DB (RLS restricted)
        const { error: dbError } = await supabase
            .from('organization_documents')
            .delete()
            .eq('id', documentId);

        if (dbError) throw new Error('Failed to delete document record');

        // 2. Resolve storage path
        let filePath = fileUrl;
        const urlParts = fileUrl.split('/org_documents/');
        if (urlParts.length === 2) {
            filePath = urlParts[1];
        }

        // 3. Remove from Storage
        await supabase.storage.from('org_documents').remove([filePath]);

        revalidatePath('/dashboard/documents');
        return { success: true };
    } catch (error: any) {
        console.error('Delete document error:', error);
        return { error: error.message || 'Failed to delete document' };
    }
}

import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Updates an organization document name.
 */
export async function updateOrgDocumentName(documentId: string, newName: string) {
    try {
        const supabase = await createClient();

        // 1. Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { error: 'Unauthorized' };

        // 2. Update DB record using Admin Client to bypass RLS
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('organization_documents')
            .update({ file_name: newName })
            .eq('id', documentId)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            throw new Error(`Update failed: ${error.message}`);
        }

        if (!data) {
            throw new Error('Document not found.');
        }

        revalidatePath('/dashboard/documents');
        return { success: true };
    } catch (error: any) {
        console.error('Rename document error:', error);
        return { error: error.message || 'Failed to rename document' };
    }
}
