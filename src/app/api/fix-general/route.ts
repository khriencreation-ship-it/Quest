import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all companies owned by this user
    const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', data.user.id);

    if (companies) {
        for (const company of companies) {
            // Check if General exists
            const { data: existingGeneral } = await supabase
                .from('organizations')
                .select('id')
                .eq('company_id', company.id)
                .eq('name', 'General')
                .maybeSingle();

            if (!existingGeneral) {
                // Insert General
                await supabase.from('organizations').insert({
                    company_id: company.id,
                    name: 'General',
                });
            }
        }
    }

    return NextResponse.json({ success: true });
}
