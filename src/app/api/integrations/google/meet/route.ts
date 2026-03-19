import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { companyId, date, time, summary = 'Scheduled Meeting' } = body;

        if (!companyId || !date || !time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch integration tokens
        const { data: integration, error: intError } = await supabase
            .from('integrations')
            .select('access_token, refresh_token, expires_at')
            .eq('company_id', companyId)
            .eq('service_type', 'google')
            .single();

        if (intError || !integration || !integration.access_token) {
            return NextResponse.json({ error: 'Google integration not found or unauthorized' }, { status: 404 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token,
            expiry_date: new Date(integration.expires_at).getTime()
        });

        // Optional: Listen for token refresh and update DB (requires admin client to bypass RLS)
        // oauth2Client.on('tokens', async (tokens) => {
        //     console.log('Tokens refreshed');
        //     // Update DB here if needed
        // });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Combine date and time
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour meeting

        const event = {
            summary,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1, // Must be 1 to successfully generate the meet link
            requestBody: event,
        });

        const meetLink = response.data.hangoutLink;

        if (!meetLink) {
            throw new Error("Failed to generate Google Meet link from the Calendar API.");
        }

        // Store meeting in Database
        const { error: dbError } = await supabase.from('meetings').insert({
            company_id: companyId,
            title: summary,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            meet_link: meetLink,
            google_event_id: response.data.id,
            created_by: user.id
        });

        if (dbError) {
            console.error('Failed to store meeting in DB:', dbError);
            // Optionally throw or return an error, but since the meet link is created, we will just log it.
        }

        return NextResponse.json({ meetLink, eventId: response.data.id });
    } catch (error: any) {
        console.error('Error creating Google Meet:', error);
        return NextResponse.json({ error: error.message || 'Failed to create meeting' }, { status: 500 });
    }
}
