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

        const { data: tenant, error } = await supabase
            .from('company_credentials')
            .select('id, client_id, client_secret')
            .eq('company_id', companyId)
            .eq('service_type', 'google')
            .single();

        if (error || !tenant) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const oauth2Client = new google.auth.OAuth2(
            tenant.client_id,
            tenant.client_secret,
            `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback?companyId=${companyId}`
        );
        // Scopes you need
        const scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email'];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // ensures we get a refresh token
            scope: scopes,
            prompt: 'consent',      // ensures refresh token every time
        });

        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Error generating auth URL:', error);
        return NextResponse.redirect('/dashboard/integrations?error=Failed to generate auth URL');
    }
}