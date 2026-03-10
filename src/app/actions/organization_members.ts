'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Type definitions to help the compiler understand the join results
type StaffMember = {
    id: string;
    organization_id: string;
    user_id: string;
    role_id: string | null;
    user: {
        email: string;
        user_metadata: {
            full_name?: string;
        };
    };
    role?: {
        name: string;
    };
};

export async function addStaffToOrganization(orgId: string, staffId: string) {
    const supabase = await createClient();

    if (!staffId || staffId.trim() === '') {
        return { error: 'Staff ID is required' };
    }

    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return { error: 'Not authenticated' };
        }

        const { error: insertError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: orgId,
                staff_id: staffId,
            });

        if (insertError) {
            // Handle unique constraint error specifically if they are already added
            if (insertError.code === '23505') {
                return { error: 'Staff member is already in this workspace' };
            }
            return { error: insertError.message };
        }

        revalidatePath('/dashboard', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error adding staff:', error);
        return { error: 'Failed to add staff' };
    }
}

export async function removeStaffFromOrganization(orgId: string, memberId: string) {
    const supabase = await createClient();

    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return { error: 'Not authenticated' };
        }

        const { error: removeError } = await supabase
            .from('organization_members')
            .delete()
            .match({ organization_id: orgId, id: memberId });

        if (removeError) {
            return { error: removeError.message };
        }

        revalidatePath('/dashboard', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error removing staff:', error);
        return { error: 'Failed to remove staff' };
    }
}
