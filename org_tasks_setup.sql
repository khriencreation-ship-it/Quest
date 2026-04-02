-- ==============================================================================
-- ORGANIZATION TASKS SYSTEM 
-- Secure, internal internal tasks scoped to organizations (no project tie-in)
-- ==============================================================================

-- 1. Create the main Tasks table
CREATE TABLE public.organization_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Assignees table (linked to staffs)
CREATE TABLE public.org_task_assignees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.organization_tasks(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staffs(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(task_id, staff_id)
);

-- 3. Create Attachments table
CREATE TABLE public.org_task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.organization_tasks(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Storage Bucket for Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('org_task_attachments', 'org_task_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Auth users can upload org task attachments" ON storage.objects;
CREATE POLICY "Auth users can upload org task attachments"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org_task_attachments');

DROP POLICY IF EXISTS "Auth users can view org task attachments" ON storage.objects;
CREATE POLICY "Auth users can view org task attachments"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'org_task_attachments');

DROP POLICY IF EXISTS "Auth users can delete org task attachments" ON storage.objects;
CREATE POLICY "Auth users can delete org task attachments"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'org_task_attachments');


-- 5. RLS Policies for Tables
ALTER TABLE public.organization_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_task_attachments ENABLE ROW LEVEL SECURITY;

-- Everyone in the company can view tasks for now (can lock down later if needed)
CREATE POLICY "Company users can view tasks" ON public.organization_tasks FOR SELECT
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()) OR 
      company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid()));

CREATE POLICY "Company users can insert tasks" ON public.organization_tasks FOR INSERT
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()) OR 
            company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid()));

CREATE POLICY "Company users can update tasks" ON public.organization_tasks FOR UPDATE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()) OR 
       company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid()));

CREATE POLICY "Company users can delete tasks" ON public.organization_tasks FOR DELETE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()) OR 
       company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid()));

-- Policy for assignees
CREATE POLICY "Company users can manage assignees" ON public.org_task_assignees FOR ALL
USING (true) WITH CHECK (true);

-- Policy for attachments
CREATE POLICY "Company users can manage attachments" ON public.org_task_attachments FOR ALL
USING (true) WITH CHECK (true);
