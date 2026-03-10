'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function resetStaffPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
        return { error: 'Password must be at least 6 characters.' };
    }

    // Verify the caller is an authenticated company owner
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();
    if (!company) return { error: 'Company not found.' };

    // Confirm the target user belongs to this company
    const { count } = await supabase
        .from('staffs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('user_id', userId);
    if (!count || count === 0) return { error: 'Staff member not found in your company.' };

    // Update the password via admin API
    const adminSupabase = createAdminClient();
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
        password: newPassword,
    });

    if (updateError) return { error: updateError.message };
    return { success: true };
}

export async function upsertOwnerAsStaff(formData: FormData) {
    const supabase = await createClient();

    const firstName = (formData.get('first_name') as string)?.trim();
    const lastName = (formData.get('last_name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || null;
    const roleId = formData.get('role_id') as string | null;
    const contractType = (formData.get('contract_type') as string) || 'full_time';

    if (!firstName || !lastName) {
        return { error: 'First name and last name are required.' };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();

    if (!company) return { error: 'Company not found.' };

    const fullName = `${firstName} ${lastName}`;

    // Upsert: create a real staffs row for the owner if none exists, or update it
    const { error } = await supabase
        .from('staffs')
        .upsert({
            company_id: company.id,
            user_id: userData.user.id,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            email: userData.user.email || '',
            phone,
            role_id: roleId || null,
            contract_type: contractType,
            is_manager: true,
        }, {
            onConflict: 'company_id,email',
        });

    if (error) return { error: error.message };

    revalidatePath('/dashboard/staffs');
    return { success: true };
}

export async function createStaff(formData: FormData) {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const firstName = (formData.get('first_name') as string)?.trim();
    const lastName = (formData.get('last_name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || null;
    const password = formData.get('password') as string;
    const roleId = formData.get('role_id') as string | null;
    const contractType = formData.get('contract_type') as string;
    const isManager = formData.get('manager_access') === 'true';

    if (!firstName || !lastName || !email || !password) {
        return { error: 'First name, last name, email, and password are required.' };
    }
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' };
    }

    // Get the caller's company
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single();

    if (!company) return { error: 'Company not found.' };

    // Create the auth user using the admin client
    const { data: newAuthUser, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            role: isManager ? 'manager' : 'user',
            full_name: `${firstName} ${lastName}`,
        },
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            return { error: 'A user with this email already exists.' };
        }
        return { error: authError.message };
    }

    // Create the staff record linked to the new auth user
    const { error: staffError } = await supabase
        .from('staffs')
        .insert({
            company_id: company.id,
            user_id: newAuthUser.user.id,
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            role_id: roleId || null,
            contract_type: contractType || 'full_time',
            is_manager: isManager,
        });

    if (staffError) {
        // Roll back: delete the auth user we just created
        await adminSupabase.auth.admin.deleteUser(newAuthUser.user.id);
        if (staffError.code === '23505') {
            return { error: 'A staff member with this email already exists in your company.' };
        }
        return { error: staffError.message };
    }

    // Fetch the newly created staff ID
    const { data: newStaff } = await supabase
        .from('staffs')
        .select('id')
        .eq('email', email)
        .eq('company_id', company.id)
        .single();

    if (newStaff) {
        // Fetch all organizations in the company
        const { data: orgs } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('company_id', company.id);

        if (orgs && orgs.length > 0) {
            if (isManager) {
                // Managers get added to ALL organizations
                const orgMemberRows = orgs.map(org => ({
                    organization_id: org.id,
                    staff_id: newStaff.id,
                    role_id: null,
                }));
                await supabase.from('organization_members').insert(orgMemberRows);
            } else {
                // Regular staff only get added to the General organization
                const generalOrg = orgs.find(o => o.name === 'General');
                if (generalOrg) {
                    await supabase.from('organization_members').insert({
                        organization_id: generalOrg.id,
                        staff_id: newStaff.id,
                        role_id: null,
                    });
                }
            }
        }
    }

    revalidatePath('/dashboard/staffs');
    return { success: true };
}

export async function deleteStaff(id: string, userId: string | null) {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    // Delete the staff record first
    const { error: staffError } = await supabase
        .from('staffs')
        .delete()
        .eq('id', id);

    if (staffError) return { error: staffError.message };

    // Then delete the auth user if they have one
    if (userId) {
        await adminSupabase.auth.admin.deleteUser(userId);
    }

    revalidatePath('/dashboard/staffs');
    return { success: true };
}

export async function updateStaff(id: string, formData: FormData) {
    const supabase = await createClient();

    const firstName = (formData.get('first_name') as string)?.trim();
    const lastName = (formData.get('last_name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || null;
    const roleId = formData.get('role_id') as string | null;
    const contractType = formData.get('contract_type') as string;

    if (!firstName || !lastName) {
        return { error: 'First name and last name are required.' };
    }

    const { data: updatedRows, error } = await supabase
        .from('staffs')
        .update({
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            phone: phone || null,
            role_id: roleId || null,
            contract_type: contractType || 'full_time',
        })
        .eq('id', id)
        .select();

    if (error) return { error: error.message };
    if (!updatedRows || updatedRows.length === 0) return { error: 'Update blocked. Check database permissions.' };

    revalidatePath('/dashboard/staffs');
    return { success: true };
}
