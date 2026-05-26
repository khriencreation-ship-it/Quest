import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { getCompany } from "@/utils/getCompany";
import Calendar from "@/components/dashboard/calendar/calendar";
import { getMeetings } from "@/app/actions/calendar";
import { getMyMeetings } from "@/app/actions/calendar_my";

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/login");

  const company = await getCompany(userData.user);

  if (!company) {
    if (userData.user.user_metadata?.role === "manager")
      redirect("/onboarding");
    else redirect("/unauthorized");
  }

  const isManager = userData.user.user_metadata?.role === "manager";
  let allowedOrgIds: string[] = [];

  const adminSupabase = createAdminClient();

  // If staff, determine which organizations they belong to
  if (!isManager) {
    const { data: staffRec } = await adminSupabase
      .from("staffs")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("company_id", company.id)
      .single();

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
      .single();

    if (generalOrg && !allowedOrgIds.includes(generalOrg.id)) {
      allowedOrgIds.push(generalOrg.id);
    }
  }

  // Fetch departments
  let departments: any[] = [];
  {
    let q = adminSupabase
      .from("organizations")
      .select("id, name")
      .eq("company_id", company.id);
    if (!isManager && allowedOrgIds.length > 0) {
      q = q.in("id", allowedOrgIds);
    }
    const { data: deps } = await q.order("name");
    departments = deps || [];
  }

  // Fetch staff from the user's department(s)
  let initialStaff: any[] = [];

  if (isManager) {
    // Fetch all staff with their organization memberships
    const { data: omData } = await adminSupabase
      .from("organization_members")
      .select(
        `
        staffs:staff_id (
          id,
          user_id,
          full_name,
          email
        ),
        organization_id,
        roles:role_id (
          name
        )
      `,
      )
      .in(
        "organization_id",
        (
          await adminSupabase
            .from("organizations")
            .select("id")
            .eq("company_id", company.id)
        ).data?.map((o: any) => o.id) || [],
      );

    // Group by staff id, collecting org ids and roles
    const staffMap = new Map<string, any>();
    (omData || []).forEach((om: any) => {
      if (!om.staffs) return;
      const sid = om.staffs.id;
      if (!staffMap.has(sid)) {
        staffMap.set(sid, {
          id: om.staffs.id,
          user_id: om.staffs.user_id,
          full_name: om.staffs.full_name,
          email: om.staffs.email,
          role_name: om.roles?.name || null,
          org_ids: [] as string[],
        });
      }
      if (om.organization_id) {
        staffMap.get(sid).org_ids.push(om.organization_id);
      }
    });
    initialStaff = Array.from(staffMap.values());
  } else if (allowedOrgIds.length > 0) {
    // Staff see only members from their own department(s)
    const { data: omData } = await adminSupabase
      .from("organization_members")
      .select(
        `
        staffs:staff_id (
          id,
          user_id,
          full_name,
          email
        ),
        organization_id,
        roles:role_id (
          name
        )
      `,
      )
      .in("organization_id", allowedOrgIds);

    // Deduplicate by staff id, collecting org ids
    const staffMap = new Map<string, any>();
    (omData || []).forEach((om: any) => {
      if (!om.staffs) return;
      const sid = om.staffs.id;
      if (!staffMap.has(sid)) {
        staffMap.set(sid, {
          id: om.staffs.id,
          user_id: om.staffs.user_id,
          full_name: om.staffs.full_name,
          email: om.staffs.email,
          role_name: om.roles?.name || null,
          org_ids: [] as string[],
        });
      }
      if (om.organization_id) {
        staffMap.get(sid).org_ids.push(om.organization_id);
      }
    });
    initialStaff = Array.from(staffMap.values());
  }

  const { meetings: initialMeetings } = await getMeetings();
  const { meetings: myMeetings } = await getMyMeetings();

  return (
    <div>
      <Calendar
        initialStaff={initialStaff}
        initialDepartments={departments}
        initialMeetings={initialMeetings || []}
        initialMyMeetings={myMeetings || []}
        companyId={company.id}
        currentUserId={userData.user.id}
        isManager={isManager}
      />
    </div>
  );
}
