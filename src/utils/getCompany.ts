import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function getCompany(user: { id: string, user_metadata: any }) {
    const supabase = await createClient();
    const role = user.user_metadata?.role;

    if (role === 'manager') {
        const { data: company } = await supabase
            .from('companies')
            .select('id, name')
            .eq('owner_id', user.id)
            .single();
        return company;
    } else {
        const adminSupabase = createAdminClient();
        // Find company through staffs table
        const { data: staffData } = await adminSupabase
            .from('staffs')
            .select('id, companies(id, name)')
            .eq('user_id', user.id)
            .single();

        if (staffData && staffData.companies) {
            return Array.isArray(staffData.companies) ? staffData.companies[0] : staffData.companies;
        }
        return null;
    }
}
