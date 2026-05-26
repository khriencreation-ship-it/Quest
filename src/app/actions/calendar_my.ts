"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCompany } from "@/utils/getCompany";

/**
 * Fetch meetings where the current user is the creator or an invited attendee.
 */
export async function getMyMeetings() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Not authenticated." };
    }

    const company = await getCompany(user);
    if (!company) {
      return { error: "No company associated with this account." };
    }

    const adminSupabase = createAdminClient();

    // Get the current user's staff record
    const { data: staffRec } = await adminSupabase
      .from("staffs")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", company.id)
      .maybeSingle();

    const staffId = staffRec?.id;

    // Fetch all company meetings with attendees
    const { data: allMeetings, error } = await adminSupabase
      .from("meetings")
      .select(`
        id, title, description,
        start_time, end_time,
        type, location,
        organization_id, created_by, created_at,
        meeting_attendees (
          staff_id,
          staffs:staff_id (id, full_name, email)
        )
      `)
      .eq("company_id", company.id)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching my meetings:", error);
      return { error: `Failed to fetch meetings: ${error.message}` };
    }

    // Filter: meetings created by me OR where I'm an attendee
    const myMeetings = (allMeetings || []).filter((m: any) => {
      if (m.created_by === user.id) return true;
      if (staffId && m.meeting_attendees?.some((a: any) => a.staff_id === staffId)) return true;
      return false;
    });

    return { meetings: myMeetings };
  } catch (error: any) {
    console.error("Critical error in getMyMeetings:", error);
    return { error: `Internal Server Error: ${error.message || error}` };
  }
}
