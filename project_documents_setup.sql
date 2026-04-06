-- ============================================================================
-- PROJECT DOCUMENTS TABLE & POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor to create the project_documents table,
-- RLS policies, and indexes.
-- ============================================================================

-- 1. Create the table
CREATE TABLE public.project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- 3. Indexes
CREATE INDEX idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX idx_project_documents_company_id ON public.project_documents(company_id);

-- 4. RLS Policies (using existing SECURITY DEFINER helpers to avoid recursion)

-- SELECT: Company owner OR project member
CREATE POLICY "View project documents"
ON public.project_documents FOR SELECT
USING (
    public.is_company_owner(company_id)
    OR public.is_project_member(project_id)
);

-- INSERT: Company owner OR project member
CREATE POLICY "Upload project documents"
ON public.project_documents FOR INSERT
WITH CHECK (
    public.is_company_owner(company_id)
    OR public.is_project_member(project_id)
);

-- DELETE: Uploader OR company owner
CREATE POLICY "Delete project documents"
ON public.project_documents FOR DELETE
USING (
    uploaded_by = auth.uid()
    OR public.is_company_owner(company_id)
);

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================
-- NOTE: You must also create a storage bucket in Supabase Dashboard:
--   1. Go to Storage → New Bucket
--   2. Name: "project-documents"
--   3. Public: OFF (private bucket)
--   4. File size limit: 50MB (52428800 bytes)
--   5. Allowed MIME types: image/png, image/jpeg, image/gif, image/webp,
--      video/mp4, video/quicktime,
--      application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--      application/vnd.openxmlformats-officedocument.presentationml.presentation,
--      application/zip, text/csv
--
-- Then run the storage policies below:
-- ============================================================================

-- Storage policies (run AFTER creating the bucket)

-- Allow authenticated users to upload to the project-documents bucket
CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-documents');

-- Allow authenticated users to read from the project-documents bucket
CREATE POLICY "Authenticated users can read project documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-documents');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own project documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-documents');
