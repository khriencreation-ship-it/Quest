'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createRole(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    if (!name || name.trim() === '') {
        return { error: 'Role name is required.' };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return { error: 'Not authenticated.' };
    }

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();

    if (!company) {
        return { error: 'Company not found.' };
    }

    const { error: insertError } = await supabase
        .from('roles')
        .insert({
            company_id: company.id,
            name: name.trim(),
            description: description ? description.trim() : null,
        });

    if (insertError) {
        if (insertError.code === '23505') {
            return { error: 'A role with this name already exists.' };
        }
        return { error: insertError.message };
    }

    revalidatePath('/dashboard/roles');
    return { success: true };
}

export async function deleteRole(id: string) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return { error: 'Not authenticated.' };
    }

    const { error: deleteError } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

    if (deleteError) {
        return { error: deleteError.message };
    }

    revalidatePath('/dashboard/roles');
    return { success: true };
}

export async function updateRole(id: string, formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    if (!name || name.trim() === '') {
        return { error: 'Role name is required.' };
    }

    const { data: updatedRows, error: updateError } = await supabase
        .from('roles')
        .update({
            name: name.trim(),
            description: description ? description.trim() : null,
        })
        .eq('id', id)
        .select();

    if (updateError) return { error: updateError.message };
    if (!updatedRows || updatedRows.length === 0) return { error: 'Update blocked by database permissions.' };

    revalidatePath('/dashboard/roles');
    return { success: true };
}
