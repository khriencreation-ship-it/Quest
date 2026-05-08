import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function getCompany(user: { id: string, user_metadata: any }) {
    const supabase = await createClient();
    const role = user.user_metadata?.role;

    let company = null;

    // 1. Check if user is an owner of a company (highest priority)
    console.log('[getCompany] Checking if user is owner of a company:', user.id);
    const { data: ownedCompany, error: ownerError } = await supabase
        .from('companies')
        .select('id, name, description')
        .eq('owner_id', user.id)
        .maybeSingle();
    
    if (ownedCompany) {
        console.log('[getCompany] User is owner of:', ownedCompany.name);
        return ownedCompany;
    }

    // 2. If not owner, check if user is a staff member (including invited managers)
    console.log('[getCompany] User is not owner. Checking if user is staff member:', user.id);
    const adminSupabase = createAdminClient();
    const { data: staffData, error: staffError } = await adminSupabase
        .from('staffs')
        .select('id, companies(id, name, description)')
        .eq('user_id', user.id)
        .maybeSingle();

    if (staffError) {
        console.error('[getCompany] Staff query failed:', staffError.message);
        return null;
    }

    if (staffData && staffData.companies) {
        const result = Array.isArray(staffData.companies) ? staffData.companies[0] : staffData.companies;
        console.log('[getCompany] User found as staff in:', result.name);
        return result;
    }

    console.log('[getCompany] No company found for user.');
    return null;
}
