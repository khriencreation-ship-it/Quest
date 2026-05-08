-- Update the get_organization_staff RPC function to include the role name
DROP FUNCTION IF EXISTS public.get_organization_staff(UUID);

CREATE OR REPLACE FUNCTION public.get_organization_staff(p_organization_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        s.id,
        s.user_id,
        s.full_name,
        s.email,
        r.name as role_name
    FROM public.organization_members om
    JOIN public.staffs s ON om.staff_id = s.id
    LEFT JOIN public.roles r ON om.role_id = r.id
    WHERE om.organization_id = p_organization_id
    ORDER BY s.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_staff(UUID) TO authenticated;
