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

  // Fetch departments using the admin client
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

  const { data: organizations } = await orgsQuery.order("name");
  const departments = organizations || [];

  // Determine active organization ID
  let activeOrgId = "";
  if (departments.length > 0) {
    const generalOrg = departments.find((d) => d.name === "General");
    activeOrgId = generalOrg ? generalOrg.id : departments[0].id;
  }

  // Fetch initial staff for active organization using admin client
  let initialStaff: any[] = [];
  if (activeOrgId) {
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
      .eq("organization_id", activeOrgId);

    initialStaff = (omData || [])
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
  }

  return (
    <div>
      <Calendar
        initialDepartments={departments}
        initialStaff={initialStaff}
        initialOrgId={activeOrgId}
        currentUserId={userData.user.id}
        isManager={isManager}
      />
    </div>
  );
}
