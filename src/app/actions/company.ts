'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCompany(formData: FormData) {
    const supabase = await createClient();

    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name) {
        return { error: 'Company name is required.' };
    }

    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
            return { error: 'Not authenticated.' };
        }

        const { data: updatedRows, error: updateError } = await supabase
            .from('companies')
            .update({
                name,
                description,
            })
            .eq('owner_id', userData.user.id)
            .select();

        if (updateError) {
            return { error: updateError.message };
        }

        if (!updatedRows || updatedRows.length === 0) {
            return { error: 'Only owners can update company details.' };
        }

        revalidatePath('/dashboard', 'layout');
        revalidatePath('/dashboard/settings');

        return { success: true };
    } catch (error: any) {
        console.error('Error updating company:', error);
        return { error: 'Failed to update company.' };
    }
}
