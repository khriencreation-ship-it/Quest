import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client that bypasses RLS.
 * Only used server-side for privileged operations like creating auth users.
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env.local file.');
    }

    return createSupabaseClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
