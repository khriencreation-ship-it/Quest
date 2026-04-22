-- ============================================================================
-- PROJECT MESSAGING SYSTEM
-- ============================================================================
-- This script creates the table for project-based chat messages and sets up
-- RLS policies to allow both staff and portal clients to communicate.
-- ============================================================================

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL, -- auth.uid() for staff, client_id for portal users
    sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'client')),
    content TEXT NOT NULL,
    document_id UUID REFERENCES public.project_documents(id) ON DELETE SET NULL, -- Link to unified docs
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Enable Realtime for this table
ALTER TABLE public.project_messages REPLICA IDENTITY FULL;

-- 3. Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Helper: Check if a user is the client of this project (via portal_token)
-- We'll assume the portal session provides the project_id and the token.
-- In strict RLS, we check if the token matches the client associated with the project.
CREATE OR REPLACE FUNCTION public.is_project_client(p_project_id UUID, p_portal_token UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.clients c ON p.client_id = c.id
        WHERE p.id = p_project_id AND c.portal_token = p_portal_token
    );
$$;

-- 5. Messaging Policies

-- SELECT: Staff members or authenticated company owner
CREATE POLICY "Staff can view project messages"
ON public.project_messages FOR SELECT
USING (
    public.is_company_owner((SELECT company_id FROM public.projects WHERE id = project_id))
    OR public.is_project_member(project_id)
);

-- INSERT: Staff members
CREATE POLICY "Staff can send project messages"
ON public.project_messages FOR INSERT
WITH CHECK (
    public.is_company_owner((SELECT company_id FROM public.projects WHERE id = project_id))
    OR public.is_project_member(project_id)
);

-- Note: Portal users (clients) will use Service Role via Server Actions for now 
-- to ensure secure access via portal_token, as standard Supabase token-less RLS
-- is complex to set up without custom JWTs.

-- 6. Unified Documents RLS Update
-- Allow the project's client to see documents if they have a valid token (handled in Actions)
-- But for internal DB security, we'll keep the existing staff-only policies and 
-- use the Service Role for Portal views.
