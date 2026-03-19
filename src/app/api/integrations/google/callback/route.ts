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

// Return an HTML response that closes the popup and redirects the parent window
function popupRedirect(url: string) {
    return new NextResponse(`
        <html>
            <body>
                <script>
                    if (window.opener && !window.opener.closed) {
                        window.opener.location.href = '${url}';
                        window.close();
                    } else {
                        window.location.href = '${url}';
                    }
                </script>
            </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html' },
    });
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return popupRedirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    const code = req.nextUrl.searchParams.get('code');
    const companyId = req.nextUrl.searchParams.get('state');
    const state = req.nextUrl.searchParams.get('state');
    const userId = user.id; // Optional: who connected

    if (!code || !companyId) {
        return popupRedirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/google?error=Missing code or companyId`);
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
        const { data, error } = await supabase.from('integrations').upsert(
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
                } as Integration,
            ],
            { onConflict: 'company_id, service_type' }
        );
        if (error) {
            console.error('Supabase upsert error:', error);
            return popupRedirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/google?error=Supabase upsert failed`
            );
        }

        return popupRedirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/google?success=Connected successfully`);
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return popupRedirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/google?error=OAuth failed`
        );
    }
}