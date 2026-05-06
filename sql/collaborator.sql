-- ============================================================
-- Collaborators
-- Tracks extra staff members who are added to a task beyond
-- the primary assignee(s).
--
-- Design notes:
--   • staff_id  → staffs.id  (the staff record)
--   • added_by  → auth.users (who performed the add)
--   • When a collaborator is inserted the server action ALSO
--     writes their user_id into task_assignees so the task
--     surfaces in their kanban board through the existing
--     assignee-based filter.
--
-- ▶ Run this entire script in your Supabase SQL Editor.
-- ============================================================


-- ── 1. TABLE ────────────────────────────────────────────────

DROP TABLE IF EXISTS public.collaborators;

CREATE TABLE public.collaborators (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    UUID NOT NULL
               REFERENCES public.tasks(id)  ON DELETE CASCADE,
  staff_id   UUID NOT NULL
               REFERENCES public.staffs(id) ON DELETE CASCADE,
  added_by   UUID
               REFERENCES auth.users(id)    ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_collaborator UNIQUE (task_id, staff_id)
);


-- ── 2. INDEXES ───────────────────────────────────────────────

CREATE INDEX idx_collaborators_task_id  ON public.collaborators(task_id);
CREATE INDEX idx_collaborators_staff_id ON public.collaborators(staff_id);


-- ── 3. ENABLE RLS ────────────────────────────────────────────

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;


-- ── 4. RLS POLICIES ──────────────────────────────────────────

-- Helper sub-query reused below:
--   "tasks that belong to the caller's company"
--   →  task_id IN (SELECT id FROM tasks WHERE company_id IN
--                  (SELECT id FROM companies WHERE owner_id = auth.uid()))
--
--   "tasks whose project the caller is a staff member of"
--   →  task_id IN (SELECT t.id FROM tasks t
--                  JOIN project_staff ps ON ps.project_id = t.project_id
--                  JOIN staffs s         ON s.id = ps.staff_id
--                  WHERE s.user_id = auth.uid())
--
--   "tasks for which the caller is the dept manager"
--   →  task_id IN (SELECT t.id FROM tasks t
--                  JOIN projects      p ON p.id = t.project_id
--                  JOIN organizations o ON o.id = p.organization_id
--                  JOIN staffs        s ON s.id = o.manager_staff_id
--                  WHERE s.user_id = auth.uid())


-- SELECT — visible to:
--   a) company owner
--   b) any project staff member on the same project
--   c) the collaborator themselves
DROP POLICY IF EXISTS "View collaborators" ON public.collaborators;

CREATE POLICY "View collaborators"
ON public.collaborators FOR SELECT
USING (
  -- a) Company owner
  task_id IN (
    SELECT id FROM public.tasks
    WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  OR
  -- b) Project staff member on the same project
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.project_staff ps ON ps.project_id = t.project_id
    JOIN public.staffs        s  ON s.id = ps.staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- c) The collaborator themselves
  staff_id IN (
    SELECT id FROM public.staffs WHERE user_id = auth.uid()
  )
);


-- INSERT — allowed for:
--   a) company owner
--   b) department manager of the project's organisation
--   c) any project staff member
--   d) a task assignee (staff can add collaborators to tasks
--      they are assigned to)
DROP POLICY IF EXISTS "Add collaborator" ON public.collaborators;

CREATE POLICY "Add collaborator"
ON public.collaborators FOR INSERT
WITH CHECK (
  -- a) Company owner
  task_id IN (
    SELECT id FROM public.tasks
    WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  OR
  -- b) Department manager of the project's organisation
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.projects      p ON p.id = t.project_id
    JOIN public.organizations o ON o.id = p.organization_id
    JOIN public.staffs        s ON s.id = o.manager_staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- c) Project staff member
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.project_staff ps ON ps.project_id = t.project_id
    JOIN public.staffs        s  ON s.id = ps.staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- d) Assignee on the task
  task_id IN (
    SELECT task_id FROM public.task_assignees
    WHERE user_id = auth.uid()
  )
);


-- DELETE — allowed for:
--   a) company owner
--   b) department manager of the project's organisation
--   c) the collaborator removing themselves
DROP POLICY IF EXISTS "Remove collaborator" ON public.collaborators;

CREATE POLICY "Remove collaborator"
ON public.collaborators FOR DELETE
USING (
  -- a) Company owner
  task_id IN (
    SELECT id FROM public.tasks
    WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  OR
  -- b) Department manager of the project's organisation
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.projects      p ON p.id = t.project_id
    JOIN public.organizations o ON o.id = p.organization_id
    JOIN public.staffs        s ON s.id = o.manager_staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- c) Collaborator removing themselves
  staff_id IN (
    SELECT id FROM public.staffs WHERE user_id = auth.uid()
  )
);


-- ── 5. TASK VISIBILITY FOR COLLABORATORS ─────────────────────
-- The existing "Manager or Project Staff can view tasks" policy
-- does not cover collaborators.  Drop it and create a broader
-- replacement that also lets collaborators see their tasks.

DROP POLICY IF EXISTS "Manager or Project Staff can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "View tasks" ON public.tasks;

CREATE POLICY "View tasks"
ON public.tasks FOR SELECT
USING (
  -- Company owner
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
  OR
  -- Project staff member
  project_id IN (
    SELECT ps.project_id FROM public.project_staff ps
    JOIN public.staffs s ON s.id = ps.staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- Task assignee
  id IN (
    SELECT task_id FROM public.task_assignees
    WHERE user_id = auth.uid()
  )
  OR
  -- Collaborator on the task
  id IN (
    SELECT c.task_id FROM public.collaborators c
    JOIN public.staffs s ON s.id = c.staff_id
    WHERE s.user_id = auth.uid()
  )
);


-- ── 6. TASK-ASSIGNEES POLICY UPDATE ──────────────────────────
-- Allow dept managers and project staff to manage assignees
-- (needed so the server-action dual-write into task_assignees
-- works even when going through RLS instead of the admin client).

DROP POLICY IF EXISTS "Manager can manage task assignments" ON public.task_assignees;
DROP POLICY IF EXISTS "Manage task assignments"            ON public.task_assignees;

CREATE POLICY "Manage task assignments"
ON public.task_assignees FOR ALL
USING (
  -- Company owner
  task_id IN (
    SELECT id FROM public.tasks
    WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
  OR
  -- Department manager of the project's organisation
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.projects      p ON p.id = t.project_id
    JOIN public.organizations o ON o.id = p.organization_id
    JOIN public.staffs        s ON s.id = o.manager_staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- Project staff member
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.project_staff ps ON ps.project_id = t.project_id
    JOIN public.staffs        s  ON s.id = ps.staff_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- The assignee themselves (so staff can un-assign themselves)
  user_id = auth.uid()
);


-- ── 7. RELOAD SCHEMA CACHE ───────────────────────────────────
NOTIFY pgrst, 'reload schema';
