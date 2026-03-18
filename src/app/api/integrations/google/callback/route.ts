import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Integration {
    company_id: string;
    service_type: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: Date;
    account_email: string;
    connected_by: string | null;
    is_active: boolean;
}
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const code = req.nextUrl.searchParams.get('code');
    const companyId = req.nextUrl.searchParams.get('state');
    const state = req.nextUrl.searchParams.get('state');
    const userId = req.nextUrl.searchParams.get('userId'); // Optional: who connected
    console.log(code, companyId, state, userId);
    if (!code || !companyId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=Missing code or companyId`);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        // Get user email
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const { data: userInfo } = await oauth2.userinfo.get();

        if (!userInfo.email) throw new Error('Failed to get user email');

        // Upsert integration in Supabase
        await supabase.from('integrations').upsert(
            [
                {
                    company_id: companyId,
                    service_type: 'google',
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
                    account_email: userInfo.email,
                    connected_by: userId || null,
                    is_active: true,
                } as Integration, // Cast ensures TypeScript sees the correct type
            ],
            { onConflict: 'company_id' }
        );
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=Connected successfully`);
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=OAuth failed`
        );
    }
}