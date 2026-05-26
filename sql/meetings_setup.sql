-- ==============================================================================
-- MEETINGS EXTENSION
-- Adds department scoping, attendees, and richer meeting data
-- to the existing `meetings` table from supabase_schema.sql
-- ==============================================================================

-- 1. Add missing columns to the existing meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'physical' CHECK (type IN ('physical', 'online')),
ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';

-- 2. Meeting Attendees (junction table linking meetings -> staff)
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staffs(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(meeting_id, staff_id)
);

-- 3. Enable RLS on attendees table
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

-- 4. Replace owner-only RLS policies so staff can also view/insert meetings
DROP POLICY IF EXISTS "View meetings" ON public.meetings;
CREATE POLICY "View meetings"
ON public.meetings FOR SELECT
USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  OR
  company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Insert meetings" ON public.meetings;
CREATE POLICY "Insert meetings"
ON public.meetings FOR INSERT
WITH CHECK (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  OR
  company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Update meetings" ON public.meetings;
CREATE POLICY "Update meetings"
ON public.meetings FOR UPDATE
USING (
  created_by = auth.uid()
  OR
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Delete meetings" ON public.meetings;
CREATE POLICY "Delete meetings"
ON public.meetings FOR DELETE
USING (
  created_by = auth.uid()
  OR
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
);

-- 5. Attendees RLS
DROP POLICY IF EXISTS "Company users can view meeting attendees" ON public.meeting_attendees;
CREATE POLICY "Company users can view meeting attendees"
ON public.meeting_attendees FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Company users can insert meeting attendees" ON public.meeting_attendees;
CREATE POLICY "Company users can insert meeting attendees"
ON public.meeting_attendees FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Company users can delete meeting attendees" ON public.meeting_attendees;
CREATE POLICY "Company users can delete meeting attendees"
ON public.meeting_attendees FOR DELETE
USING (true);
DROP POLICY IF EXISTS "View meetings" ON public.meetings;
CREATE POLICY "View meetings"
ON public.meetings FOR SELECT
USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  OR
  company_id IN (SELECT company_id FROM public.staffs WHERE user_id = auth.uid())
);
