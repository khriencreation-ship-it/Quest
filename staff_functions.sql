-- ============================================================================
-- Staff Selection Functions for Project Creation
-- ============================================================================
-- These functions help fetch available staff and assign them to projects
-- in an RLS-safe manner.
-- ============================================================================

-- ============================================================================
-- FUNCTION: Fetch all staff members in the user's company
-- ============================================================================
-- Returns: id, user_id, full_name, email for all staff in the company
-- where the current user is the owner.
--
-- RLS-SAFE: Uses SECURITY DEFINER to bypass RLS on the staffs table.
-- This prevents any recursion issues when the frontend calls this.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_company_staff()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT s.id, s.user_id, s.full_name, s.email
    FROM public.staffs s
    WHERE s.company_id IN (
        SELECT c.id FROM public.companies c
        WHERE c.owner_id = auth.uid()
    )
    ORDER BY s.full_name;
$$;

-- ============================================================================
-- FUNCTION: Bulk insert project staff members
-- ============================================================================
-- Usage: Call this after creating a project to assign staff members.
-- 
-- Parameters:
--   p_project_id UUID - The newly created project ID
--   p_staff_ids UUID[] - Array of staff IDs to assign to the project
--
-- RLS-SAFE: SECURITY DEFINER runs as DB owner, so:
--   1. It bypasses project_staff RLS policies entirely
--   2. It does NOT trigger recursion because no RLS is evaluated
--   3. We validate that the project belongs to the user's company first
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_project_staff(
    p_project_id UUID,
    p_staff_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_staff_id UUID;
    v_company_id_from_project UUID;
    v_user_company_id UUID;
BEGIN
    -- First, verify the project belongs to the user's company
    -- This is a safety check to ensure users can only add staff to their own projects
    SELECT p.company_id INTO v_company_id_from_project
    FROM public.projects p
    WHERE p.id = p_project_id;

    -- Get the user's company
    SELECT c.id INTO v_user_company_id
    FROM public.companies c
    WHERE c.owner_id = auth.uid();

    -- Security check: project must belong to user's company
    IF v_company_id_from_project IS NULL THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    IF v_company_id_from_project != v_user_company_id THEN
        RAISE EXCEPTION 'You do not have permission to modify this project';
    END IF;

    -- Loop through each staff ID and insert into project_staff
    FOREACH v_staff_id IN ARRAY p_staff_ids
    LOOP
        INSERT INTO public.project_staff (project_id, staff_id)
        VALUES (p_project_id, v_staff_id)
        ON CONFLICT (project_id, staff_id) DO NOTHING;
    END LOOP;

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- FUNCTION: Get currently assigned staff for a project
-- ============================================================================
-- RLS-SAFE: SECURITY DEFINER bypasses RLS on project_staff and staffs.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_project_staff(p_project_id UUID)
RETURNS TABLE (
    staff_id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        s.id AS staff_id,
        s.user_id,
        s.full_name,
        s.email
    FROM public.project_staff ps
    JOIN public.staffs s ON ps.staff_id = s.id
    WHERE ps.project_id = p_project_id
    ORDER BY s.full_name;
$$;

-- ============================================================================
-- Verify functions are working (run in SQL Editor):
-- ============================================================================
-- SELECT * FROM public.get_company_staff();
-- SELECT * FROM public.get_project_staff('<project-id>');
