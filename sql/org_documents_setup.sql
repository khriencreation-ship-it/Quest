-- ============================================================================
-- Organization Documents Setup Script
-- ============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.organization_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Guidelines & SOPs', 'Templates', 'Meeting Notes', 'General')),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Company Manager / Admin can view all documents within their company
-- Staff can view documents for organizations they belong to
CREATE POLICY "Users can view org documents"
ON public.organization_documents FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members ps JOIN public.staffs s ON ps.staff_id = s.id WHERE s.user_id = auth.uid()) OR 
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- Policy: Staff can upload documents to organizations they belong to
CREATE POLICY "Staff can upload org documents"
ON public.organization_documents FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members ps JOIN public.staffs s ON ps.staff_id = s.id WHERE s.user_id = auth.uid()) OR 
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- Policy: Uploader or Manager can delete
CREATE POLICY "Uploader or Manager can delete org documents"
ON public.organization_documents FOR DELETE USING (
    uploaded_by = auth.uid() OR
    company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- 4. Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'org_documents', 
    'org_documents', 
    false,
    52428800, -- 50MB limit
    '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,text/plain}'
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = 52428800,
    allowed_mime_types = '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,text/plain}';

-- 5. Storage Policies for `org_documents` bucket
DROP POLICY IF EXISTS "Auth users can view org documents" ON storage.objects;
CREATE POLICY "Auth users can view org documents"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'org_documents');

DROP POLICY IF EXISTS "Auth users can upload org documents" ON storage.objects;
CREATE POLICY "Auth users can upload org documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org_documents');

DROP POLICY IF EXISTS "Uploader can delete org documents" ON storage.objects;
CREATE POLICY "Uploader can delete org documents"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'org_documents' AND owner = auth.uid());
