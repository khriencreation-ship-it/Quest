'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeManagerOnboarding({
    companyName,
    organizations,
    roles,
}: {
    companyName: string;
    organizations: string[];
    roles: string[];
}) {
    const supabase = await createClient();

    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            throw new Error('Not authenticated.');
        }

        // 1. Create the Company
        const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({ name: companyName, owner_id: userData.user.id })
            .select()
            .single();

        if (companyError || !newCompany) throw companyError;

        // 2. Insert Organizations using the new company_id
        // Ensure "General" is always included as the default organization
        const orgsWithDefault = Array.from(new Set(['General', ...organizations]));

        if (orgsWithDefault.length > 0) {
            const orgsToInsert = orgsWithDefault.map((org: string) => ({
                company_id: newCompany.id,
                name: org,
            }));

            const { error: orgsError } = await supabase
                .from('organizations')
                .insert(orgsToInsert);

            if (orgsError) throw orgsError;
        }

        // 3. Insert Roles using the new company_id
        if (roles.length > 0) {
            const rolesToInsert = roles.map((role: string) => ({
                company_id: newCompany.id,
                name: role,
            }));

            const { error: rolesError } = await supabase
                .from('roles')
                .insert(rolesToInsert);

            if (rolesError) throw rolesError;
        }

        // Revalidate the dashboard layout to show the fresh data
        revalidatePath('/dashboard', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Error completing onboarding:', error);
        return { success: false, error: error.message || 'Failed to complete onboarding.' };
    }
}
