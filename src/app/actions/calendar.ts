"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCompany } from "@/utils/getCompany";
import { createNotification } from "./notifications";

export async function getCalendarData(organizationId?: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Not authenticated. Please log in." };
    }

    const company = await getCompany(user);
    if (!company) {
      return { error: "No company associated with this account." };
    }

    const adminSupabase = createAdminClient();
    const isManager = user.user_metadata?.role === "manager";

    let allowedOrgIds: string[] = [];

    if (!isManager) {
      const { data: staffRec } = await adminSupabase
        .from("staffs")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", company.id)
        .maybeSingle();

      if (staffRec) {
        const { data: memberOrgs } = await adminSupabase
          .from("organization_members")
          .select("organization_id")
          .eq("staff_id", staffRec.id);
        allowedOrgIds = (memberOrgs || []).map((m: any) => m.organization_id);
      }

      const { data: generalOrg } = await adminSupabase
        .from("organizations")
        .select("id")
        .eq("company_id", company.id)
        .eq("name", "General")
        .maybeSingle();

      if (generalOrg && !allowedOrgIds.includes(generalOrg.id)) {
        allowedOrgIds.push(generalOrg.id);
      }
    }

    let orgsQuery = adminSupabase
      .from("organizations")
      .select("id, name")
      .eq("company_id", company.id);

    if (!isManager) {
      if (allowedOrgIds.length > 0) {
        orgsQuery = orgsQuery.in("id", allowedOrgIds);
      } else {
        orgsQuery = orgsQuery.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }

    const { data: departments, error: orgsError } = await orgsQuery.order(
      "name",
      { ascending: true },
    );

    if (orgsError) {
      console.error("Error fetching organizations:", orgsError);
      return { error: `Failed to fetch departments: ${orgsError.message}` };
    }

    let activeOrgId = organizationId;
    if (!activeOrgId && departments && departments.length > 0) {
      const generalOrg = departments.find((d) => d.name === "General");
      activeOrgId = generalOrg ? generalOrg.id : departments[0].id;
    }

    let staffList: any[] = [];
    if (activeOrgId) {
      const { data: omData, error: omError } = await adminSupabase
        .from("organization_members")
        .select(
          `
          staffs:staff_id (
            id, user_id, full_name, email
          ),
          roles:role_id (name)
        `,
        )
        .eq("organization_id", activeOrgId);

      if (omError) {
        console.error("Error calling organization members:", omError);
        return {
          error: `Failed to fetch department staff: ${omError.message}`,
        };
      }

      staffList = (omData || [])
        .map((om: any) => {
          if (!om.staffs) return null;
          return {
            id: om.staffs.id,
            user_id: om.staffs.user_id,
            full_name: om.staffs.full_name,
            email: om.staffs.email,
            role_name: om.roles?.name || null,
          };
        })
        .filter(Boolean);
    } else {
      const { data: staffData, error: staffError } = await adminSupabase
        .from("staffs")
        .select("id, user_id, full_name, email")
        .eq("company_id", company.id);

      if (staffError) {
        console.error("Error fetching company staff:", staffError);
        return {
          error: `Failed to fetch company staff: ${staffError.message}`,
        };
      }

      staffList = staffData || [];
    }

    return {
      departments: departments || [],
      activeOrgId,
      staff: staffList,
    };
  } catch (error: any) {
    console.error("Critical error in getCalendarData server action:", error);
    return { error: `Internal Server Error: ${error.message || error}` };
  }
}

export async function scheduleMeetingAndNotify(meeting: {
  title: string;
  date: string;
  time: string;
  type: "physical" | "online";
  location: string;
  description?: string;
  organizationId?: string;
  attendees: { staffId: string; userId: string; name: string }[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const company = await getCompany(user);
  if (!company) {
    return { error: "No company associated with this account." };
  }

  const adminSupabase = createAdminClient();

  let inviterName = user.user_metadata?.full_name || "Someone";
  let isManager = user.user_metadata?.role === "manager";

  const { data: staffProfile } = await adminSupabase
    .from("staffs")
    .select("full_name, is_manager")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffProfile) {
    inviterName = staffProfile.full_name;
    if (staffProfile.is_manager) {
      isManager = true;
    }
  }

  // 1. Insert the meeting into the database
  const { data: newMeeting, error: meetingError } = await adminSupabase
    .from("meetings")
    .insert({
      company_id: company.id,
      organization_id: meeting.organizationId || null,
      title: meeting.title,
      description: meeting.description || null,
      start_time: `${meeting.date}T${(() => {
        const [tp, p] = meeting.time.split(" ");
        let [h, m] = tp.split(":").map(Number);
        if (p === "PM" && h !== 12) h += 12;
        if (p === "AM" && h === 12) h = 0;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      })()}:00+00:00`,
      end_time: new Date(
        new Date(
          `${meeting.date}T${(() => {
            const [tp, p] = meeting.time.split(" ");
            let [h, m] = tp.split(":").map(Number);
            if (p === "PM" && h !== 12) h += 12;
            if (p === "AM" && h === 12) h = 0;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          })()}:00+00:00`,
        ).getTime() + 3600000,
      ).toISOString(),
      type: meeting.type,
      location: meeting.location,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (meetingError || !newMeeting) {
    console.error("Failed to create meeting:", meetingError);
    return {
      error: `Failed to create meeting: ${meetingError?.message || "Unknown error"}`,
    };
  }

  // 2. Insert attendees into meeting_attendees
  if (meeting.attendees.length > 0) {
    const attendeeRows = meeting.attendees.map((att) => ({
      meeting_id: newMeeting.id,
      staff_id: att.staffId,
    }));

    const { error: attendeeError } = await adminSupabase
      .from("meeting_attendees")
      .insert(attendeeRows);

    if (attendeeError) {
      console.error("Failed to insert attendees:", attendeeError);
    }
  }

  // 3. Send notifications to attendees
  const roleText = isManager ? "manager" : "user";
  const notificationTitle = "Meeting Invitation";
  const notificationMessage = `${inviterName} (${roleText}) has invited you to this meeting: ${meeting.title} on ${meeting.date} at ${meeting.time}`;

  const notificationPromises = meeting.attendees
    .filter((att) => att.userId && att.userId !== user.id)
    .map((att) =>
      createNotification(
        att.userId,
        notificationTitle,
        notificationMessage,
        "meeting_invite",
        "/dashboard/calendar",
      ),
    );

  await Promise.all(notificationPromises);

  return { success: true, meetingId: newMeeting.id };
}

export async function getMeetings(organizationId?: string) {
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

    let query = adminSupabase
      .from("meetings")
      .select(
        `
        id, title, description,
        start_time, end_time,
        type, location,
        organization_id, created_by, created_at,
        meeting_attendees (
          staff_id,
          staffs:staff_id (id, full_name, email)
        )
      `,
      )
      .eq("company_id", company.id)
      .order("meeting_date", { ascending: true });

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error("Error fetching meetings:", error);
      return { error: `Failed to fetch meetings: ${error.message}` };
    }

    return { meetings: meetings || [] };
  } catch (error: any) {
    console.error("Critical error in getMeetings:", error);
    return { error: `Internal Server Error: ${error.message || error}` };
  }
}
