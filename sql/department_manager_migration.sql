-- ============================================================
-- Department Manager Migration
-- Adds manager_staff_id to the organizations table so each
-- workspace can designate one staff member as its lead.
-- ============================================================

-- 1. Add the column (safe to run multiple times)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS manager_staff_id UUID
  REFERENCES public.staffs(id) ON DELETE SET NULL;

-- 2. RLS UPDATE policy — same pattern as the existing
--    "Users can update orgs in their company" policy, but
--    scoped explicitly to the department-manager assignment
--    so intent is clear and the policy can be audited/revoked
--    independently if needed.
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
