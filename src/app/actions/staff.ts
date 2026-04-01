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