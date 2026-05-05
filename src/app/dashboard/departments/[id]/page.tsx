import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import OrgSettingsForm from "@/components/dashboard/OrgSettingsForm";
import ManageStaffSection from "@/components/dashboard/ManageStaffSection";
import AssignDepartmentManagerForm from "@/components/dashboard/AssignDepartmentManagerForm";

export default async function ManageOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/login");
  }

  // Fetch the specific organization
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*, companies(id)")
    .eq("id", resolvedParams.id)
    .single();

  if (orgError || !organization) {
    redirect("/dashboard/departments");
  }

  const isGeneral = organization.name === "General";

  // Fetch ALL staff belonging to the company
  const { data: allStaffData } = await supabase
    .from("staffs")
    .select("*")
    .eq("company_id", organization.company_id);

  const allStaff = allStaffData || [];

  // Fetch members for this workspace
  // If it's the general workspace, everyone in the company is a member automatically
  let mappedMembers: any[] = [];

  if (isGeneral) {
    mappedMembers = allStaff.map((staff) => ({
      id: `temp-${staff.id}`,
      staff_id: staff.id,
      email: staff.email,
      full_name: staff.full_name,
      role: staff.is_manager ? "Manager" : "Member",
      created_at: staff.created_at,
    }));
  } else {
    const { data: membersData } = await supabase
      .from("organization_members")
      .select(
        `
                id,
                staff_id,
                role_id,
                created_at,
                roles(name),
                staffs(email, full_name, is_manager)
            `,
      )
      .eq("organization_id", organization.id);

    mappedMembers = (membersData || []).map((m) => ({
      id: m.id,
      staff_id: m.staff_id,
      email: (m.staffs as any)?.email || "Unknown",
      full_name: (m.staffs as any)?.full_name || "Unknown",
      // Use the role from the roles table if set, otherwise fall back to
      // Manager/Member based on the staff member's is_manager flag
      role:
        (m.roles as any)?.name ||
        ((m.staffs as any)?.is_manager ? "Manager" : "Member"),
      created_at: m.created_at,
    }));
  }

  // The company owner (manager) is always an implicit member of every department.
  // If they have completed their staff profile (via the Staff page) they will have
  // a real row in the `staffs` table — use that row's `id` so it satisfies the
  // organizations.manager_staff_id FK.  If they haven't yet, we still show them
  // in the members list for display but exclude them from the dept-manager
  // dropdown (selecting them would violate the FK constraint).
  const ownerStaffRecord = allStaff.find((s) => s.user_id === userData.user.id);

  const ownerEntry = {
    // Use the real staffs.id when available; fall back to auth id for display only
    id: ownerStaffRecord?.id ?? `owner-${userData.user.id}`,
    staff_id: ownerStaffRecord?.id ?? userData.user.id,
    email: userData.user.email || "",
    full_name:
      userData.user.user_metadata?.full_name ||
      userData.user.email?.split("@")[0] ||
      "Manager",
    role: "Manager",
    created_at: userData.user.created_at,
  };

  // Avoid duplicating if the owner is already in the list (e.g. they have a
  // staffs row and are a member of this department).
  const alreadyIncluded = mappedMembers.some(
    (m) => m.email === ownerEntry.email,
  );
  if (!alreadyIncluded) {
    mappedMembers = [ownerEntry, ...mappedMembers];
  }

  // Build a separate list for the "Assign Dept Manager" dropdown that contains
  // ONLY members whose staff_id exists in the staffs table.  This prevents the
  // FK violation that occurs when someone without a staffs row (e.g. the owner
  // before they complete their profile) is submitted as manager_staff_id.
  const validStaffIds = new Set(allStaff.map((s) => s.id));
  const assignableMembers = mappedMembers.filter((m) =>
    validStaffIds.has(m.staff_id),
  );

  // Fetch actual counts from `projects` table for this department
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  const memberCount = mappedMembers.length;

  // Pull the currently-assigned department manager (nullable column on organizations)
  const currentManagerStaffId: string | null =
    (organization as typeof organization & { manager_staff_id?: string | null })
      .manager_staff_id ?? null;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <Link
        href="/dashboard/departments"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Departments
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#2eb781]/10 flex items-center justify-center font-bold text-[#2eb781] border border-[#2eb781]/20">
            {organization.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {organization.name}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wider mt-1">
              Department ID: {organization.id.split("-")[0]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2eb781]/10 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-[#2eb781]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Members</p>
            <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
          </div>
        </div>

        <Link
          href={`/dashboard/projects?org=${organization.id}`}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-[#2eb781]/30 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-[#2eb781]/10 flex items-center justify-center shrink-0 group-hover:bg-[#2eb781] transition-colors">
            <FolderKanban className="w-6 h-6 text-[#2eb781] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
              Total Projects
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {projectCount || 0}
            </p>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-300 transform rotate-180 group-hover:text-[#2eb781] transition-all" />
        </Link>
      </div>

      {/* Staff Management Section */}
      <ManageStaffSection
        organizationId={organization.id}
        isGeneral={isGeneral}
        members={mappedMembers}
        allStaff={allStaff}
        currentManagerStaffId={currentManagerStaffId}
      />
      <AssignDepartmentManagerForm
        organizationId={organization.id}
        members={assignableMembers}
        currentManagerStaffId={currentManagerStaffId}
        isGeneral={isGeneral}
      />

      {/* Settings Form */}
      <OrgSettingsForm organization={organization} />
    </div>
  );
}
