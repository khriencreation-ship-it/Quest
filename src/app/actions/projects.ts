'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCompany } from '@/utils/getCompany';

export async function createProject(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const organization_id = formData.get('organization_id') as string;
    const client_id = formData.get('client_id') as string;
    const service_id = formData.get('service_id') as string;
    const description = formData.get('description') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const is_ongoing = formData.get('is_ongoing') === 'on';
    const is_internal = formData.get('is_internal') === 'on';

    if (!name || !organization_id || (!is_internal && !client_id) || !service_id) {
        return { error: 'Missing required fields' };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { error: 'Unauthorized' };
    }

    const company = await getCompany(userData.user);

    if (!company) {
        return { error: 'No company found for this user.' };
    }

     try {
         const { data, error } = await supabase
             .from('projects')
             .insert({
                 company_id: company.id,
                 name,
                 organization_id,
                 client_id: is_internal ? null : client_id,
                 service_id,
                 description,
                 start_date: start_date || null,
                 end_date: is_ongoing ? null : (end_date || null),
                 status: 'pending', // Default status
                 is_internal
             })
             .select()
             .single();

         if (error) {
             console.error('Error creating project:', error);
             return { error: error.message };
         }

         // Handle staff assignment if staff_ids were provided
         const staffIds = formData.getAll('staff_ids');
         if (staffIds.length > 0) {
             try {
                 await supabase.rpc('add_project_staff', {
                     p_project_id: data.id,
                     p_staff_ids: staffIds
                 });
             } catch (staffError) {
                 console.error('Error assigning staff to project:', staffError);
                 // Don't fail the entire operation if staff assignment fails
                 // The project is still created successfully
             }
         }

         revalidatePath('/dashboard/projects');
         return { success: true, project: data };
     } catch (error: any) {
         console.error('Unexpected error creating project:', error);
         return { error: error.message || 'An unexpected error occurred' };
     }
}

export async function updateProject(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const organization_id = formData.get('organization_id') as string;
    const client_id = formData.get('client_id') as string;
    const service_id = formData.get('service_id') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const is_ongoing = formData.get('is_ongoing') === 'on';
    const is_internal = formData.get('is_internal') === 'on';

    if (!id || !name || !organization_id || (!is_internal && !client_id) || !service_id || !status) {
        return { error: 'Missing required fields' };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { error: 'Unauthorized' };
    }

    const company = await getCompany(userData.user);

    if (!company) {
        return { error: 'No company found for this user.' };
    }

    try {
        const { error } = await supabase
            .from('projects')
            .update({
                name,
                organization_id,
                client_id: is_internal ? null : client_id,
                service_id,
                description,
                status,
                start_date: start_date || null,
                end_date: is_ongoing ? null : (end_date || null),
                is_internal
            })
            .eq('id', id)
            .eq('company_id', company.id);

        if (error) {
            console.error('Error updating project:', error);
            return { error: error.message };
        }

        revalidatePath('/dashboard/projects');
        revalidatePath(`/dashboard/projects/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error updating project:', error);
        return { error: error.message || 'An unexpected error occurred' };
    }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { error: 'Unauthorized' };
    }

    const company = await getCompany(userData.user);

    if (!company) {
        return { error: 'No company found for this user.' };
    }

    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('company_id', company.id);

        if (error) {
            console.error('Error deleting project:', error);
            return { error: error.message };
        }

        revalidatePath('/dashboard/projects');
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error deleting project:', error);
        return { error: error.message || 'An unexpected error occurred' };
    }
}

export async function updateProjectScope(projectId: string, scope_config: any) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { error: 'Unauthorized' };
    }

    const company = await getCompany(userData.user);

    if (!company) {
        return { error: 'No company found for this user.' };
    }

    try {
        const { error } = await supabase
            .from('projects')
            .update({ scope_config })
            .eq('id', projectId)
            .eq('company_id', company.id);

        if (error) {
            console.error('Error updating project scope:', error);
            return { error: error.message };
        }

        revalidatePath(`/dashboard/projects/${projectId}`);
        return { error: null };
    } catch (error: any) {
        console.error('Unexpected error updating project scope:', error);
        return { error: error.message || 'An unexpected error occurred' };
    }
}
