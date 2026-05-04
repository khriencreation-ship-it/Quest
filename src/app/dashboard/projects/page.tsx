import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { getCompany } from "@/utils/getCompany";
import ProjectsClient from "@/components/dashboard/ProjectsClient";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org: activeOrgId } = await searchParams;
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/login");

  const company = await getCompany(userData.user);

  if (!company) {
    if (userData.user.user_metadata?.role === "manager")
      redirect("/onboarding");
    else redirect("/unauthorized");
  }

  // isOwner = the company owner (full access, sees ALL projects)
  const isOwner = userData.user.user_metadata?.role === "manager";
  let isDepartmentManager = false;
  let allowedOrgIds: string[] = [];

  const adminSupabase = createAdminClient();

  // For non-owners (staff), determine which departments they belong to
  // and whether they are a designated department manager for any of them.
  if (!isOwner) {
    // 1. Get the staff record for this user
    const { data: staffRec } = await adminSupabase
      .from("staffs")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("company_id", company.id)
      .maybeSingle();

    if (staffRec) {
      // 2. Get department IDs from memberships
      const { data: memberOrgs } = await adminSupabase
        .from("organization_members")
        .select("organization_id")
        .eq("staff_id", staffRec.id);

      allowedOrgIds = (memberOrgs || []).map((m: any) => m.organization_id);

      // 3. Check if this staff member is a department manager for any org
      const { data: managedOrgs } = await adminSupabase
        .from("organizations")
        .select("id")
        .eq("company_id", company.id)
        .eq("manager_staff_id", staffRec.id);

      if (managedOrgs && managedOrgs.length > 0) {
        isDepartmentManager = true;
        // Ensure their managed departments are in the allowed list
        for (const org of managedOrgs) {
          if (!allowedOrgIds.includes(org.id)) {
            allowedOrgIds.push(org.id);
          }
        }
      }
    }

    // 4. Always include the "General" department
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

  // isManager for UI: company owners AND department managers can create/edit
  // projects and assign tasks. Department managers are still org-scoped below.
  const isManager = isOwner || isDepartmentManager;

  // Fetch projects with their relation data
  let projectsQuery = adminSupabase
    .from("projects")
    .select(
      `
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            created_at,
            organization_id,
            client_id,
            is_internal,
            service_id,
            organizations(name),
            clients(name),
            services(name)
        `,
    )
    .eq("company_id", company.id);

  // Non-owners (including department managers) only see projects in their departments
  if (!isOwner) {
    if (allowedOrgIds.length > 0) {
      projectsQuery = projectsQuery.in("organization_id", allowedOrgIds);
    } else {
      projectsQuery = projectsQuery.eq(
        "organization_id",
        "00000000-0000-0000-0000-000000000000",
      );
    }
  }

  const { data: projects } = await projectsQuery.order("created_at", {
    ascending: false,
  });

  // Fetch dropdown data for the create project modal.
  // Non-owners (including dept managers) only see their allowed orgs.
  let orgsQuery = adminSupabase
    .from("organizations")
    .select("id, name")
    .eq("company_id", company.id);

  if (!isOwner) {
    if (allowedOrgIds.length > 0) {
      orgsQuery = orgsQuery.in("id", allowedOrgIds);
    } else {
      orgsQuery = orgsQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const [organizationsResponse, clientsResponse, servicesResponse] =
    await Promise.all([
      orgsQuery.order("name"),
      adminSupabase
        .from("clients")
        .select("id, name")
        .eq("company_id", company.id)
        .order("name"),
      adminSupabase
        .from("services")
        .select("id, name")
        .eq("company_id", company.id)
        .order("name"),
    ]);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeOrgId ? "Workspace Projects" : "All Projects"}
          </h1>
          <p className="text-gray-500">
            {activeOrgId
              ? "View and manage projects in this specific workspace."
              : "A high-level overview of active projects across your departments."}
          </p>
        </div>
      </div>
      <ProjectsClient
        initialProjects={(projects as any) || []}
        organizations={organizationsResponse.data || []}
        clients={clientsResponse.data || []}
        services={servicesResponse.data || []}
        isManager={isManager}
      />
    </div>
  );
}
