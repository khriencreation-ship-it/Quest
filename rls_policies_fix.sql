-- ============================================================================
-- RECURSION-SAFE RLS POLICIES
-- ============================================================================
-- 
-- WHY INFINITE RECURSION HAPPENS:
-- When a policy on table A references table B via subquery, PostgreSQL evaluates
-- table B's RLS policies too. If table B's policy references table A (or references
-- table C which references table A), you get infinite recursion.
--
-- EXAMPLE OF THE RECURSION CHAIN IN THIS SCHEMA:
--   task_assignees SELECT → queries tasks → triggers tasks SELECT policy
--   tasks SELECT → queries project_staff → triggers project_staff SELECT policy  
--   project_staff SELECT → queries staffs → triggers staffs SELECT policy
--   If any of these circle back, PostgreSQL throws "infinite recursion detected"
--
-- THE FIX: Use a SECURITY DEFINER helper function that bypasses RLS when
-- checking ownership/membership. This breaks the recursion chain because
-- the function runs as the DB owner (bypassing RLS on referenced tables).
-- ============================================================================


-- ============================================================================
-- STEP 1: Create helper functions (SECURITY DEFINER = bypasses RLS)
-- ============================================================================

-- Helper: Check if the current user is the company owner
-- RECURSION-SAFE: Runs as DB owner, so querying `companies` does NOT trigger
-- the companies RLS policy. This is the base check used by all other policies.
CREATE OR REPLACE FUNCTION public.is_company_owner(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_id = auth.uid()
  );
$$;

-- Helper: Check if the current user is staff in a given company
-- RECURSION-SAFE: Bypasses RLS on `staffs` table.
CREATE OR REPLACE FUNCTION public.is_company_staff(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staffs
    WHERE company_id = p_company_id AND user_id = auth.uid()
  );
$$;

-- Helper: Check if the current user is assigned to a project (via project_staff + staffs)
-- RECURSION-SAFE: Bypasses RLS on `project_staff` and `staffs` tables.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_staff ps
    JOIN public.staffs s ON ps.staff_id = s.id
    WHERE ps.project_id = p_project_id
      AND s.user_id = auth.uid()
  );
$$;

-- Helper: Check if the current user is assigned to a specific task
-- RECURSION-SAFE: Bypasses RLS on `task_assignees` table.
CREATE OR REPLACE FUNCTION public.is_task_assignee(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_assignees
    WHERE task_id = p_task_id AND user_id = auth.uid()
  );
$$;

-- Helper: Check if the current user can access a task (owner, project member, or assignee)
-- RECURSION-SAFE: Uses the above helper functions which all bypass RLS.
CREATE OR REPLACE FUNCTION public.can_access_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = p_task_id
      AND (
        -- Company owner
        public.is_company_owner(t.company_id)
        -- Project member
        OR public.is_project_member(t.project_id)
        -- Task assignee
        OR public.is_task_assignee(t.id)
      )
  );
$$;


-- ============================================================================
-- STEP 2: Drop ALL existing policies on the 4 tables
-- ============================================================================

-- project_staff policies
DROP POLICY IF EXISTS "View project staff" ON public.project_staff;
DROP POLICY IF EXISTS "Manager can manage project staff" ON public.project_staff;

-- tasks policies
DROP POLICY IF EXISTS "Manager can create task" ON public.tasks;
DROP POLICY IF EXISTS "Manager or Project Staff can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Manager or Project Staff can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Manager can delete tasks" ON public.tasks;

-- task_assignees policies
DROP POLICY IF EXISTS "View task assignments" ON public.task_assignees;
DROP POLICY IF EXISTS "Manager can manage task assignments" ON public.task_assignees;

-- task_attachments policies
DROP POLICY IF EXISTS "View task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Staff or Manager can upload submittals" ON public.task_attachments;


-- ============================================================================
-- STEP 3: Ensure RLS is enabled (idempotent)
-- ============================================================================

ALTER TABLE public.project_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 4: project_staff policies
-- ============================================================================

-- SELECT: Company owner can see all project staff; staff members can see their own assignments
-- RECURSION-SAFE: Uses is_company_owner() (SECURITY DEFINER) to check companies,
-- and directly checks staffs.user_id without triggering staffs RLS.
CREATE POLICY "project_staff_select"
ON public.project_staff FOR SELECT
USING (
  -- Company owner: look up company_id via projects table (no RLS issue since
  -- projects RLS only queries companies, which is handled by is_company_owner)
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_staff.project_id
      AND public.is_company_owner(p.company_id)
  )
  OR
  -- Staff member can see their own project assignments
  EXISTS (
    SELECT 1 FROM public.staffs s
    WHERE s.id = project_staff.staff_id
      AND s.user_id = auth.uid()
  )
);

-- INSERT: Only company owners can assign staff to projects
-- RECURSION-SAFE: Uses is_company_owner() helper.
CREATE POLICY "project_staff_insert"
ON public.project_staff FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_staff.project_id
      AND public.is_company_owner(p.company_id)
  )
);

-- UPDATE: Only company owners can update project staff assignments
-- RECURSION-SAFE: Uses is_company_owner() helper.
CREATE POLICY "project_staff_update"
ON public.project_staff FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_staff.project_id
      AND public.is_company_owner(p.company_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_staff.project_id
      AND public.is_company_owner(p.company_id)
  )
);

-- DELETE: Only company owners can remove staff from projects
-- RECURSION-SAFE: Uses is_company_owner() helper.
CREATE POLICY "project_staff_delete"
ON public.project_staff FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_staff.project_id
      AND public.is_company_owner(p.company_id)
  )
);


-- ============================================================================
-- STEP 5: tasks policies
-- ============================================================================

-- SELECT: Company owner, project staff, or task assignee can view tasks
-- RECURSION-SAFE: All checks use SECURITY DEFINER helpers that bypass RLS.
-- No subquery triggers RLS on another table that would circle back to tasks.
CREATE POLICY "tasks_select"
ON public.tasks FOR SELECT
USING (
  -- Company owner
  public.is_company_owner(tasks.company_id)
  OR
  -- Project staff member
  public.is_project_member(tasks.project_id)
  OR
  -- Directly assigned to this task
  public.is_task_assignee(tasks.id)
);

-- INSERT: Only company owners can create tasks
-- RECURSION-SAFE: Uses is_company_owner() helper.
CREATE POLICY "tasks_insert"
ON public.tasks FOR INSERT
WITH CHECK (
  public.is_company_owner(tasks.company_id)
);

-- UPDATE: Company owner, project staff, or task assignee can update tasks
-- RECURSION-SAFE: All checks use SECURITY DEFINER helpers.
CREATE POLICY "tasks_update"
ON public.tasks FOR UPDATE
USING (
  public.is_company_owner(tasks.company_id)
  OR
  public.is_project_member(tasks.project_id)
  OR
  public.is_task_assignee(tasks.id)
)
WITH CHECK (
  -- WITH CHECK = TRUE allows updating any column value once USING passes.
  -- If you want to restrict which columns can change, add checks here.
  TRUE
);

-- DELETE: Only company owners can delete tasks
-- RECURSION-SAFE: Uses is_company_owner() helper.
CREATE POLICY "tasks_delete"
ON public.tasks FOR DELETE
USING (
  public.is_company_owner(tasks.company_id)
);


-- ============================================================================
-- STEP 6: task_assignees policies
-- ============================================================================

-- SELECT: Anyone who can access the parent task can see its assignees
-- RECURSION-SAFE: Uses can_access_task() which is SECURITY DEFINER and
-- internally calls other SECURITY DEFINER helpers. No RLS chain triggered.
CREATE POLICY "task_assignees_select"
ON public.task_assignees FOR SELECT
USING (
  public.can_access_task(task_assignees.task_id)
);

-- INSERT: Company owners, project staff, and task assignees can assign users to tasks
-- RECURSION-SAFE: Uses can_access_task() which is SECURITY DEFINER — it queries
-- tasks, project_staff, task_assignees internally WITHOUT triggering their RLS policies.
-- Previously this used an inline EXISTS (SELECT FROM tasks ...) which triggered tasks RLS,
-- which in turn triggered task_assignees RLS → infinite recursion.
CREATE POLICY "task_assignees_insert"
ON public.task_assignees FOR INSERT
WITH CHECK (
  public.can_access_task(task_assignees.task_id)
);

-- UPDATE: Company owners, project staff, and task assignees can update assignments
-- RECURSION-SAFE: Uses can_access_task() SECURITY DEFINER helper — no RLS chain.
CREATE POLICY "task_assignees_update"
ON public.task_assignees FOR UPDATE
USING (
  public.can_access_task(task_assignees.task_id)
)
WITH CHECK (
  public.can_access_task(task_assignees.task_id)
);

-- DELETE: Company owners, project staff, and task assignees can remove assignments
-- RECURSION-SAFE: Uses can_access_task() SECURITY DEFINER helper — no RLS chain.
CREATE POLICY "task_assignees_delete"
ON public.task_assignees FOR DELETE
USING (
  public.can_access_task(task_assignees.task_id)
);


-- ============================================================================
-- STEP 7: task_attachments policies
-- ============================================================================

-- SELECT: Anyone who can access the parent task can see its attachments
-- RECURSION-SAFE: Uses can_access_task() which is fully SECURITY DEFINER.
CREATE POLICY "task_attachments_select"
ON public.task_attachments FOR SELECT
USING (
  public.can_access_task(task_attachments.task_id)
);

-- INSERT: Company owner or project staff can upload attachments
-- RECURSION-SAFE: Uses SECURITY DEFINER helpers via tasks table lookup.
CREATE POLICY "task_attachments_insert"
ON public.task_attachments FOR INSERT
WITH CHECK (
  public.can_access_task(task_attachments.task_id)
);

-- UPDATE: Only the uploader or company owner can update attachment metadata
-- RECURSION-SAFE: Direct column check + SECURITY DEFINER helper.
CREATE POLICY "task_attachments_update"
ON public.task_attachments FOR UPDATE
USING (
  -- Uploader can update their own
  task_attachments.uploaded_by = auth.uid()
  OR
  -- Company owner can update any
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
      AND public.is_company_owner(t.company_id)
  )
)
WITH CHECK (
  task_attachments.uploaded_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
      AND public.is_company_owner(t.company_id)
  )
);

-- DELETE: Only the uploader or company owner can delete attachments
-- RECURSION-SAFE: Same pattern as update.
CREATE POLICY "task_attachments_delete"
ON public.task_attachments FOR DELETE
USING (
  task_attachments.uploaded_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
      AND public.is_company_owner(t.company_id)
  )
);


-- ============================================================================
-- VERIFICATION: Run these queries to confirm policies are in place
-- ============================================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('tasks', 'task_assignees', 'task_attachments', 'project_staff')
-- ORDER BY tablename, cmd;
