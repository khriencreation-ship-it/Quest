"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, status: string) {
  if (!taskId || !status) {
    return { error: "taskId and status are required", data: null };
  }

  const supabase = await createClient();

  // Verify the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized", data: null };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Supabase update task error:", error);
    return { error: error.message, data: null };
  }

  revalidatePath(`/dashboard/projects`); // Revalidate for UI updates
  return { error: null, data };
}

export async function updateTaskPriority(taskId: string, priority: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tasks")
    .update({ priority })
    .eq("id", taskId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects`);
  return { success: true, data };
}

export async function getSubTasks(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    if (
      error.code === "PGRST116" ||
      error.message.includes('relation "public.task_subtasks" does not exist')
    ) {
      return {
        error:
          "Sub-tasks table not found. Please run the SQL schema in the implementation plan.",
        data: [],
      };
    }
    return { error: error.message, data: [] };
  }
  return { data };
}

export async function createSubTask(taskId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("task_subtasks")
    .insert({ task_id: taskId, title, completed: false })
    .select()
    .single();

  if (error) {
    if (
      error.code === "PGRST116" ||
      error.message.includes('relation "public.task_subtasks" does not exist')
    ) {
      return {
        error:
          "Sub-tasks table not found. Please run the SQL schema in the implementation plan.",
      };
    }
    return { error: error.message };
  }
  return { success: true, data };
}

export async function toggleSubTask(subTaskId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("task_subtasks")
    .update({ completed })
    .eq("id", subTaskId);

  if (error) {
    if (
      error.code === "PGRST116" ||
      error.message.includes('relation "public.task_subtasks" does not exist')
    ) {
      return {
        error:
          "Sub-tasks table not found. Please run the SQL schema in the implementation plan.",
      };
    }
    return { error: error.message };
  }
  return { success: true };
}

export async function deleteSubTask(subTaskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("task_subtasks")
    .delete()
    .eq("id", subTaskId);

  if (error) {
    if (
      error.code === "PGRST116" ||
      error.message.includes('relation "public.task_subtasks" does not exist')
    ) {
      return {
        error:
          "Sub-tasks table not found. Please run the SQL schema in the implementation plan.",
      };
    }
    return { error: error.message };
  }
  return { success: true };
}

export async function createProjectTask(taskData: any, assigneeId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const { data: task, error: taskError } = await adminClient
    .from("tasks")
    .insert({
      ...taskData,
      created_by: user.id,
    })
    .select()
    .single();

  if (taskError) return { error: taskError.message };

  if (assigneeId) {
    const { error: assignError } = await adminClient
      .from("task_assignees")
      .insert({
        task_id: task.id,
        user_id: assigneeId,
      });
    if (assignError) console.error("Assignee error:", assignError);
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/tasks");
  return { success: true, data: task };
}

export async function getProjectStaff(projectId: string) {
  const adminClient = createAdminClient();
  const { data: staffData, error: staffError } = await adminClient
    .from("project_staff")
    .select(
      `
            staff_id,
            staffs:staff_id (
                id,
                full_name,
                user_id
            )
        `,
    )
    .eq("project_id", projectId);

  if (staffError) return { error: staffError.message, data: [] };
  return { data: staffData?.map((s: any) => s.staffs) || [] };
}

/**
 * Add a collaborator to a task.
 *
 * @param taskId  - the task UUID
 * @param staffId - the staffs.id (NOT the auth user id)
 *
 * Dual-write:
 *   1. collaborators table  (semantic record, uses staffs.id)
 *   2. task_assignees table (kanban visibility, uses user_id from auth)
 */
export async function addTaskCollaborator(taskId: string, staffId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  // Resolve the auth user_id for this staff record (needed for task_assignees)
  const { data: staffRow, error: staffErr } = await adminClient
    .from("staffs")
    .select("user_id")
    .eq("id", staffId)
    .maybeSingle();

  if (staffErr) return { error: staffErr.message };
  if (!staffRow) return { error: "Staff member not found." };

  // 1. Insert into collaborators
  const { error: collabErr } = await adminClient
    .from("collaborators")
    .insert({ task_id: taskId, staff_id: staffId, added_by: user.id });

  if (collabErr) {
    if (collabErr.code === "23505")
      return { error: "This person is already a collaborator." };
    return { error: collabErr.message };
  }

  // 2. Also insert into task_assignees so the task appears in their kanban
  if (staffRow.user_id) {
    const { error: assignErr } = await adminClient
      .from("task_assignees")
      .insert({ task_id: taskId, user_id: staffRow.user_id })
      .select()
      .maybeSingle(); // ignore unique-violation (already an assignee is fine)
    if (assignErr && assignErr.code !== "23505") {
      console.error("task_assignees dual-write error:", assignErr.message);
    }
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}

/**
 * Remove a collaborator from a task.
 *
 * @param taskId  - the task UUID
 * @param staffId - the staffs.id (NOT the auth user id)
 */
export async function removeTaskCollaborator(taskId: string, staffId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  // Resolve the auth user_id so we can clean up task_assignees too
  const { data: staffRow } = await adminClient
    .from("staffs")
    .select("user_id")
    .eq("id", staffId)
    .maybeSingle();

  // 1. Remove from collaborators
  const { error: collabErr } = await adminClient
    .from("collaborators")
    .delete()
    .eq("task_id", taskId)
    .eq("staff_id", staffId);

  if (collabErr) return { error: collabErr.message };

  // 2. Remove from task_assignees (kanban visibility)
  if (staffRow?.user_id) {
    await adminClient
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", staffRow.user_id);
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}

/**
 * Fetch collaborators for a task, with full_name from staffs.
 */
export async function getTaskCollaborators(taskId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("collaborators")
    .select(
      `
        id,
        staff_id,
        staffs:staff_id (
          id,
          full_name,
          user_id
        )
      `,
    )
    .eq("task_id", taskId);

  if (error) return { error: error.message, data: [] };
  return { data: data || [] };
}

export async function getProjectTasks(projectId: string) {
  const adminClient = createAdminClient();
  const { data: tasksData, error: tasksError } = await adminClient
    .from("tasks")
    .select(
      `
            *,
            task_assignees (
                user_id
            ),
            task_subtasks (
                id,
                title,
                completed
            ),
            collaborators (
                staff_id
            )
        `,
    )
    .eq("project_id", projectId);

  if (tasksError) {
    return { error: tasksError.message, data: [] };
  }

  return { data: tasksData || [] };
}
