import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    try {
        const { companyId } = await req.json();
        if (!companyId) {
            return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
        }
        const { error } = await supabase
            .from('integrations')
            .delete()
            .eq('company_id', companyId)
            .eq('provider', 'google');
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting Google:', error);
        return NextResponse.json({ error: 'Failed to disconnect Google' }, { status: 500 });
    }
}