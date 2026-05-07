import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { getCompany } from "@/utils/getCompany";
import ProjectDetailClient from "@/components/dashboard/ProjectDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditProjectModal from "@/components/dashboard/EditProjectModal";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
};

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const { org } = await searchParams;
  const { id: projectId } = resolvedParams;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/login");

  const company = await getCompany(userData.user);

  if (!company) {
    if (userData.user.user_metadata?.role === "manager")
      redirect("/onboarding");
    else redirect("/unauthorized");
  }

  const adminSupabase = createAdminClient();

  // Fetch the specific project along with relation names and tasks
  const { data: project, error: projectError } = await adminSupabase
    .from("projects")
    .select(
      `
            *,
            organizations(name),
            clients(name),
            services(name, scope_config, service_type),
            client_scope(scope_config, status),
            tasks(*)
        `,
    )
    .eq("id", projectId)
    .eq("company_id", company.id)
    .single();

  if (projectError || !project) {
    redirect("/dashboard/projects");
  }

  // Determine whether the current user is the designated department manager
  // for THIS project's organisation.
  let isDepartmentManager = false;
  if (project.organization_id) {
    const { data: staffRec } = await adminSupabase
      .from("staffs")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("company_id", company.id)
      .maybeSingle();

    if (staffRec) {
      const { count } = await adminSupabase
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("id", project.organization_id)
        .eq("manager_staff_id", staffRec.id);

      if (count && count > 0) {
        isDepartmentManager = true;
      }
    }
  }

  // Only the designated department manager may edit the project or manage tasks.
  // The company owner can view everything but cannot edit/manage unless they
  // are also the department manager for this project's department.
  const canManageTasks = isDepartmentManager;

  let isSocialMedia = false;
  let scopeConfig = null;

  // Prioritize client_scope > project.scope_config > service.scope_config
  const clientScopes = project.client_scope as any[];
  const activeClientScope = clientScopes?.find((s) => s.status === "active");

  if (
    activeClientScope &&
    Object.keys(activeClientScope.scope_config).length > 0
  ) {
    scopeConfig = activeClientScope.scope_config;
  } else if (
    project.scope_config &&
    Object.keys(project.scope_config).length > 0
  ) {
    scopeConfig = project.scope_config;
  } else if (
    project.services?.scope_config &&
    Object.keys(project.services.scope_config).length > 0
  ) {
    scopeConfig = project.services.scope_config;
  }

  if (project.services?.service_type === "social_media") {
    isSocialMedia = true;
  }

  // Fetch dropdown data for the Edit Modal and Project Staff
  const [organizationsRes, clientsRes, servicesRes, projectStaffRes] =
    await Promise.all([
      adminSupabase
        .from("organizations")
        .select("id, name")
        .eq("company_id", company.id)
        .order("created_at"),
      adminSupabase
        .from("clients")
        .select("id, name")
        .eq("company_id", company.id)
        .order("created_at"),
      adminSupabase
        .from("services")
        .select("id, name")
        .eq("company_id", company.id)
        .order("created_at"),
      adminSupabase
        .from("project_staff")
        .select("staff_id, staffs(user_id, full_name)")
        .eq("project_id", projectId),
    ]);

  const departments = organizationsRes.data || [];
  const clients = clientsRes.data || [];
  const services = servicesRes.data || [];
  const projectStaff = projectStaffRes.data?.map((ps: any) => ps.staffs) || [];

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header & Breadcrumb */}
      <div className="mb-6">
        <Link
          href={org ? `/dashboard/projects?org=${org}` : "/dashboard/projects"}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to{" "}
          {org ? "Workspace" : "Projects"}
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  project.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : project.status === "completed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {project.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-gray-500">
              {project.organizations?.name || "No Department"} •{" "}
              {project.clients?.name || "No Client"} •{" "}
              {project.services?.name || "No Service"}
            </p>
          </div>
          {isDepartmentManager && (
            <div className="flex items-center gap-3">
              <EditProjectModal
                project={{
                  id: project.id,
                  organization_id: project.organization_id || "",
                  client_id: project.client_id || "",
                  service_id: project.service_id || "",
                  name: project.name,
                  description: project.description,
                  status: project.status,
                  is_internal: project.is_internal || false,
                  start_date: project.start_date,
                  end_date: project.end_date,
                }}
                departments={departments}
                clients={clients}
                services={services}
                triggerStyle="button"
              />
            </div>
          )}
        </div>
      </div>

      {/* Client Tab System */}
      <ProjectDetailClient
        project={project}
        isSocialMedia={isSocialMedia}
        scopeConfig={scopeConfig}
        serviceType={project.services?.service_type}
        projectStaff={projectStaff}
        canManageTasks={canManageTasks}
      />
    </div>
  );
}
