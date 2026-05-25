import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { getCompany } from "@/utils/getCompany";
import Calendar from "@/components/dashboard/calendar/calendar";

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/login");

  const company = await getCompany(userData.user);

  if (!company) {
    if (userData.user.user_metadata?.role === "manager") redirect("/onboarding");
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

  // Fetch staff from the user's department(s)
  let initialStaff: any[] = [];

  if (isManager) {
    // Managers see all staff in their company
    const { data: allStaff } = await adminSupabase
      .from("staffs")
      .select("id, user_id, full_name, email")
      .eq("company_id", company.id);

    initialStaff = (allStaff || []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      full_name: s.full_name,
      email: s.email,
      role_name: null,
    }));
  } else if (allowedOrgIds.length > 0) {
    // Staff see only members from their own department(s)
    const { data: omData } = await adminSupabase
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
      .in("organization_id", allowedOrgIds);

    // Deduplicate by staff id (a person can be in multiple departments)
    const seen = new Set<string>();
    initialStaff = (omData || [])
      .map((om: any) => {
        if (!om.staffs || seen.has(om.staffs.id)) return null;
        seen.add(om.staffs.id);
        return {
          id: om.staffs.id,
          user_id: om.staffs.user_id,
          full_name: om.staffs.full_name,
          email: om.staffs.email,
          role_name: om.roles?.name || null,
        };
      })
      .filter(Boolean);
  }

  return (
    <div>
      <Calendar
        initialStaff={initialStaff}
        currentUserId={userData.user.id}
        isManager={isManager}
      />
    </div>
  );
}
