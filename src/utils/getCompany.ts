import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function getCompany(user: { id: string, user_metadata: any }) {
    const supabase = await createClient();
    const role = user.user_metadata?.role;

    if (role === 'manager') {
        console.log('[getCompany] Role is manager. Querying companies for owner_id:', user.id);
        const { data: company, error } = await supabase
            .from('companies')
            .select('id, name, description')
            .eq('owner_id', user.id)
            .maybeSingle();
        
        console.log('[getCompany] Query result:', { hasData: !!company, error: error?.message });

        if (error) {
            console.error('[getCompany] Query failed (manager, with description):', error.message);
            
            // Explicitly try a very safe query
            console.log('[getCompany] Attempting safe fallback (id, name)...');
            const { data: fallbackCompany, error: fallbackError } = await supabase
                .from('companies')
                .select('id, name')
                .eq('owner_id', user.id)
                .maybeSingle();
            
            console.log('[getCompany] Safe fallback result:', { hasData: !!fallbackCompany, error: fallbackError?.message });

            if (fallbackError) {
                console.error('[getCompany] Safe fallback failed:', fallbackError.message);
                return null;
            }
            return fallbackCompany;
        }
        return company;
    } else {
        const adminSupabase = createAdminClient();
        const { data: staffData, error } = await adminSupabase
            .from('staffs')
            .select('id, companies(id, name, description)')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('[getCompany] Staff query failed, attempting fallback...', error.message);
            const { data: fallbackStaffData, error: fallbackError } = await adminSupabase
                .from('staffs')
                .select('id, companies(id, name)')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (fallbackError) {
                console.error('[getCompany] Staff fallback failed:', fallbackError.message);
                return null;
            }

            if (fallbackStaffData && fallbackStaffData.companies) {
                return Array.isArray(fallbackStaffData.companies) ? fallbackStaffData.companies[0] : fallbackStaffData.companies;
            }
            return null;
        }

        if (staffData && staffData.companies) {
            return Array.isArray(staffData.companies) ? staffData.companies[0] : staffData.companies;
        }
        return null;
    }
}
