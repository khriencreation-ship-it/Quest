'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addClient(companyId: string, clientData: any) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { error, data } = await supabase
        .from('clients')
        .insert({
            company_id: companyId,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            company_name: clientData.company_name,
            status: clientData.status || 'active',
            notes: clientData.notes
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/clients');
    return { success: true, data };
}

export async function updateClient(clientId: string, clientData: any) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { error, data } = await supabase
        .from('clients')
        .update({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            company_name: clientData.company_name,
            status: clientData.status,
            notes: clientData.notes
        })
        .eq('id', clientId)
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/clients');
    // Also revalidate the detail page if it's open
    revalidatePath(`/dashboard/clients/${clientId}`);

    return { success: true, data };
}

export async function deleteClient(clientId: string) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/clients');
    return { success: true };
}
