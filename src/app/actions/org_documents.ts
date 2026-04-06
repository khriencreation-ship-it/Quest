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

        const { data: { publicUrl } } = supabase.storage
            .from('org_documents')
            .getPublicUrl(uploadData.path);

        // 5. Save metadata to DB
        const { error: dbError } = await supabase
            .from('organization_documents')
            .insert({
                company_id: org.company_id,
                organization_id: organizationId,
                file_name: file.name,
                file_url: publicUrl,
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
        const urlParts = fileUrl.split('/org_documents/');
        if (urlParts.length === 2) {
            const filePath = urlParts[1];
            await supabase.storage.from('org_documents').remove([filePath]);
        }

        revalidatePath('/dashboard/documents');
        return { success: true };
    } catch (error: any) {
        console.error('Delete document error:', error);
        return { error: error.message || 'Failed to delete document' };
    }
}
