-- ============================================================================
-- PROJECT MESSAGING SYSTEM (INTERNAL ONLY)
-- ============================================================================
-- This script creates the table for internal project-based chat messages.
-- Only project staff and the company owner can view or send messages.
-- ============================================================================

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL DEFAULT 'staff' CHECK (sender_type IN ('staff')),
    content TEXT NOT NULL,
    document_id UUID REFERENCES public.project_documents(id) ON DELETE SET NULL, -- Link to unified docs
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Enable Realtime for this table
ALTER TABLE public.project_messages REPLICA IDENTITY FULL;

-- 3. Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- 4. Messaging Policies

-- SELECT: Staff members or authenticated company owner
CREATE POLICY "Project members can view messages"
ON public.project_messages FOR SELECT
USING (
    public.is_company_owner((SELECT company_id FROM public.projects WHERE id = project_id))
    OR public.is_project_member(project_id)
);

-- INSERT: Project members or company owner
CREATE POLICY "Project members can send messages"
ON public.project_messages FOR INSERT
WITH CHECK (
    public.is_company_owner((SELECT company_id FROM public.projects WHERE id = project_id))
    OR public.is_project_member(project_id)
);
