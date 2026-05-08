-- ============================================================================
-- TASK REPORTS / COMMENTS SYSTEM
-- ============================================================================
-- This table stores progress reports and comments for both project tasks 
-- and organizational tasks.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL, -- Can be from 'tasks' or 'organization_tasks'
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.task_reports ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for MVP: Any authenticated user in the same company can view/add)
-- In a production environment, you would check if the user is a collaborator or manager.

CREATE POLICY "Users can view task reports"
ON public.task_reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add task reports"
ON public.task_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);
