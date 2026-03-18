import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const code = req.nextUrl.searchParams.get('code');
    const companyId = req.nextUrl.searchParams.get('companyId');
    const userId = req.nextUrl.searchParams.get('userId'); // Optional: who connected

    if (!code || !companyId) {
        return NextResponse.redirect('/dashboard/integrations?error=Missing code or companyId');
    }

    // Fetch tenant Google credentials
    const { data: tenant, error } = await supabase
        .from('companies')
        .select('id, google_client_id, google_client_secret')
        .eq('id', companyId)
        .single();

    if (error || !tenant) {
        return NextResponse.redirect('/dashboard/integrations?error=Company not found');
    }

    const oauth2Client = new google.auth.OAuth2(
        tenant.google_client_id,
        tenant.google_client_secret,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback?companyId=${companyId}`
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        // Get user email
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data: userInfo } = await oauth2.userinfo.get();

        if (!userInfo.email) throw new Error('Failed to get user email');

        // Upsert integration in Supabase
        await supabase.from('integrations').upsert({
            company_id: companyId,
            service_type: 'google',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
            account_email: userInfo.email,
            connected_by: userId || null,
            is_active: true,
        }, { onConflict: ['company_id', 'service_type'] });

        return NextResponse.redirect('/dashboard/integrations?success=Connected successfully');
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return NextResponse.redirect('/dashboard/integrations?error=OAuth failed');
    }
}