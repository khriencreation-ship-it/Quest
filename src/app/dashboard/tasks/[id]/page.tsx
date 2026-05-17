import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCompany } from "@/utils/getCompany";
import { getTaskById } from "@/app/actions/tasks";
import { getOrganizationStaff } from "@/app/actions/staff";
import TaskDetailView from "@/components/dashboard/tasks-tabs/TaskDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
};

export default async function TaskDetailPage(props: PageProps) {
  const supabase = await createClient();
  const { id: taskId } = await props.params;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/login");

  const company = await getCompany(userData.user);
  if (!company) redirect("/dashboard");

  const { data: task, error } = await getTaskById(taskId);

  if (error || !task) {
    redirect("/dashboard/tasks");
  }

  // Ensure the org parameter is present in the URL for Sidebar context
  const { org: currentOrgId } = await props.searchParams;

  const organizationId = task.is_project_task
    ? task.projects?.organization_id
    : task.organization_id;

  if (organizationId && !currentOrgId) {
    redirect(`/dashboard/tasks/${taskId}?org=${organizationId}`);
  }
  let staff = [];
  if (organizationId) {
    try {
      staff = await getOrganizationStaff(organizationId);
    } catch (err) {
      console.error("Failed to load department staff:", err);
    }
  }

  const isManager = userData.user.user_metadata?.role === "manager";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <TaskDetailView task={task} staff={staff || []} isManager={isManager} />
    </div>
  );
}
