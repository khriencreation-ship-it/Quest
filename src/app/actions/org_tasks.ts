"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrgTask(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const organization_id = formData.get("organization_id") as string;
    const due_date = formData.get("due_date") as string;
    const staff_ids = formData.getAll("staff_ids") as string[];
    const status = formData.get("status") as string;

    if (!title || !organization_id) {
      return { error: "Title and Department are required" };
    }

    // Get company_id from department
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("company_id")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return { error: "Invalid department" };
    }

    // Create Task
    const { data: task, error: taskError } = await supabase
      .from("organization_tasks")
      .insert({
        company_id: org.company_id,
        organization_id,
        title,
        description: description || null,
        due_date: due_date || null,
        status: status || "todo",
        created_by: user.id,
      })
      .select()
      .single();

    if (taskError) {
      return { error: taskError.message };
    }

    // Add Assignees and Notify
    if (staff_ids.length > 0) {
      const assignees = staff_ids.map((staff_id) => ({
        task_id: task.id,
        staff_id: staff_id,
      }));

      const { error: assignError } = await supabase
        .from("org_task_assignees")
        .insert(assignees);

      if (assignError) {
        console.error("Assign error", assignError);
      }

      // Notify Assignees
      try {
        const { data: staffRecs } = await supabase
          .from("staffs")
          .select("user_id")
          .in("id", staff_ids);

        const creatorName = user.user_metadata?.full_name || "A manager";

        const { createNotification } = await import("./notifications");

        if (staffRecs) {
          for (const s of staffRecs) {
            if (s.user_id && s.user_id !== user.id) {
              await createNotification(
                s.user_id,
                "New Workspace Task",
                `${creatorName} assigned you a workspace task: ${title}`,
                "task_assigned",
                `/dashboard/tasks/${task.id}?org=${organization_id}`
              );
            }
          }
        }
      } catch (notifyError) {
        console.error("Failed to send notifications:", notifyError);
      }
    }

    revalidatePath("/dashboard/tasks");
    return { success: true, data: task };
  } catch (e: any) {
    return { error: e.message || "An error occurred" };
  }
}

export async function updateOrgTaskStatus(taskId: string, status: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("organization_tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      return { error: error.message };
    }

    // Notify creator if completed
    if (status === "done") {
      try {
        const { data: taskInfo } = await supabase
          .from("organization_tasks")
          .select("title, created_by, organization_id")
          .eq("id", taskId)
          .single();

        if (taskInfo && taskInfo.created_by !== user.id) {
          const updaterName = user.user_metadata?.full_name || "A team member";
          const { createNotification } = await import("./notifications");
          await createNotification(
            taskInfo.created_by,
            "Workspace Task Completed",
            `${updaterName} completed the workspace task: ${taskInfo.title}`,
            "task_completed",
            `/dashboard/tasks/${taskId}?org=${taskInfo.organization_id}`
          );
        }
      } catch (e) {
        console.error("Notify completion error", e);
      }
    }

    revalidatePath("/dashboard/tasks");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "An error occurred" };
  }
}

export async function deleteOrgTask(taskId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("organization_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/tasks");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "An error occurred" };
  }
}
