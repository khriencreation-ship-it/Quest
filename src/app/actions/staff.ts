'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Fetch all staff members in the current user's company.
 * Uses a SECURITY DEFINER function to bypass RLS safely.
 */
export async function getCompanyStaff() {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Call the SECURITY DEFINER function that bypasses RLS
    const { data, error } = await supabase
        .rpc('get_company_staff');

    if (error) {
        console.error('Error fetching company staff:', error);
        throw error;
    }

    return data || [];
}
export async function getOrganizationStaff(organizationId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .rpc('get_organization_staff', { p_organization_id: organizationId });

    if (error) {
        console.error('Error fetching organization staff:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch staff members currently assigned to a specific project.
 */
export async function getProjectStaff(projectId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .rpc('get_project_staff', { p_project_id: projectId });

    if (error) {
        console.error('Error fetching project staff:', error);
        throw error;
    }

    return data || [];
}