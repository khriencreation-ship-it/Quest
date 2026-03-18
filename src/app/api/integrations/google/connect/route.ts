import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    try {
        const companyId = req.nextUrl.searchParams.get('companyId');
        if (!companyId) {
            return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
        );
        // Scopes you need
        const scopes = ['https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email'];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // ensures we get a refresh token
            scope: scopes,
            prompt: 'consent',      // ensures refresh token every time
            state: companyId
        });

        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Error generating auth URL:', error);
        return NextResponse.redirect('/dashboard/integrations?error=Failed to generate auth URL');
    }
}