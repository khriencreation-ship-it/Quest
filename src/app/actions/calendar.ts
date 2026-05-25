"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCompany } from "@/utils/getCompany";
import { createNotification } from "./notifications";

export async function getCalendarData(organizationId?: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    // Determine allowed organizations matching page rules
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

    // Fetch departments/organizations in the company using admin client to bypass RLS constraints
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

    const { data: departments, error: orgsError } = await orgsQuery.order("name", {
      ascending: true,
    });

    if (orgsError) {
      console.error("Error fetching organizations:", orgsError);
      return { error: `Failed to fetch departments: ${orgsError.message}` };
    }

    // Determine active organization ID
    let activeOrgId = organizationId;
    if (!activeOrgId && departments && departments.length > 0) {
      const generalOrg = departments.find((d) => d.name === "General");
      activeOrgId = generalOrg ? generalOrg.id : departments[0].id;
    }

    // Fetch staff for active organization using admin client
    let staffList: any[] = [];
    if (activeOrgId) {
      const { data: omData, error: omError } = await adminSupabase
        .from("organization_members")
        .select(`
          staffs:staff_id (
            id,
            user_id,
            full_name,
            email
          ),
          roles:role_id (
            name
          )
        `)
        .eq("organization_id", activeOrgId);

      if (omError) {
        console.error("Error calling organization members:", omError);
        return { error: `Failed to fetch department staff: ${omError.message}` };
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
        return { error: `Failed to fetch company staff: ${staffError.message}` };
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
  attendees: { staffId: string; userId: string; name: string }[];
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Determine inviter info
  let inviterName = user.user_metadata?.full_name || "Someone";
  let isManager = user.user_metadata?.role === "manager";

  const adminSupabase = createAdminClient();
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

  const roleText = isManager ? "manager" : "user";
  const notificationTitle = "Meeting Invitation";
  const notificationMessage = `${inviterName} (${roleText}) has invited you to this meeting: ${meeting.title} on ${meeting.date} at ${meeting.time}`;

  // Send notifications to each selected attendee
  const notificationPromises = meeting.attendees
    .filter((att) => att.userId && att.userId !== user.id) // Don't notify self
    .map((att) =>
      createNotification(
        att.userId,
        notificationTitle,
        notificationMessage,
        "meeting_invite",
        "/dashboard/calendar"
      )
    );

  await Promise.all(notificationPromises);

  return { success: true };
}
