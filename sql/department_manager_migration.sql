-- ============================================================
-- Department Manager Migration
-- Adds manager_staff_id to the organizations table so each
-- department can designate one staff member as its lead.
--
-- ▶ Run this entire script in your Supabase SQL Editor.
-- ============================================================

-- 1. Add the column (safe to run multiple times)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS manager_staff_id UUID
  REFERENCES public.staffs(id) ON DELETE SET NULL;

-- 2. RLS UPDATE policy — scoped to the department-manager assignment.
--    Drop first so re-running the script is idempotent.
DROP POLICY IF EXISTS "Users can assign department manager in their company"
  ON public.organizations;

CREATE POLICY "Users can assign department manager in their company"
ON public.organizations FOR UPDATE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

-- 3. Force PostgREST to reload its schema cache immediately so the
--    new column is visible without restarting the server.
NOTIFY pgrst, 'reload schema';
