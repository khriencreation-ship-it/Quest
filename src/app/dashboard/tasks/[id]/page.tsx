import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCompany } from "@/utils/getCompany";
import { getTaskById } from "@/app/actions/tasks";
import { getOrganizationStaff } from "@/app/actions/staff";
import TaskDetailView from "@/components/dashboard/tasks-tabs/TaskDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { id: taskId } = await params;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/login");

  const company = await getCompany(userData.user);
  if (!company) redirect("/dashboard");

  const { data: task, error } = await getTaskById(taskId);

  if (error || !task) {
    redirect("/dashboard/tasks");
  }

  // Fetch staff from the task's department only
  const organizationId = task.is_project_task 
    ? task.projects?.organization_id 
    : task.organization_id;
    
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
      <TaskDetailView 
        task={task} 
        staff={staff || []}
        isManager={isManager}
      />
    </div>
  );
}
