"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

/**
 * Internal helper to check task permissions.
 * Creator and Department Manager have full access.
 * Primary Assignees (assigned but NOT only-collaborator) have progress update access.
 * Collaborators (added via collaborators table but NOT a primary assignee) have report-only access.
 *
 * KEY RULE: If someone is both a task_assignee AND in the collaborators table,
 * they are treated as a PRIMARY ASSIGNEE with full progress permissions.
 * `isCollaboratorOnly` is true ONLY for people who are in collaborators but NOT assignees.
 */
async function getTaskPermissions(
  adminClient: any,
  taskId: string,
  userId: string,
) {
  const { data: taskData } = await adminClient
    .from("tasks")
    .select(
      `
      created_by,
      task_assignees(user_id),
      projects(organizations(manager_staff_id))
    `,
    )
    .eq("id", taskId)
    .single();

  const { data: staffRec } = await adminClient
    .from("staffs")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: collaborator } = await adminClient
    .from("collaborators")
    .select("id")
    .eq("task_id", taskId)
    .eq("staff_id", staffRec?.id)
    .maybeSingle();

  const isCreator = taskData?.created_by === userId;
  const isDeptManager =
    (taskData?.projects?.organizations as any)?.manager_staff_id ===
    staffRec?.id;
  const assigneeUserIds =
    (taskData as any)?.task_assignees?.map((a: any) => a.user_id) || [];
  const isAssignee = assigneeUserIds.includes(userId);
  const isInCollaboratorsTable = !!collaborator;

  // An assignee who is also in the collaborators table is still a primary assignee.
  // Only people who are SOLELY collaborators (not assignees) are restricted.
  const isCollaboratorOnly = isInCollaboratorsTable && !isAssignee;

  return {
    isCreator,
    isDeptManager,
    isAssignee,
    isCollaborator: isCollaboratorOnly,
  };
}

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

  // New strict Permission Check
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, taskId, user.id);

  // Collaborators cannot update status
  if (isCollaborator) return { error: "Collaborators can only add reports." };

  // Status can be updated by Dept Manager, Creator, or Assignee
  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

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

  // Notify creator if completed
  if (status === "done") {
    try {
      const { data: taskInfo } = await adminClient
        .from("tasks")
        .select("title, created_by, project_id, projects(organization_id)")
        .eq("id", taskId)
        .single();

      if (taskInfo && taskInfo.created_by !== user.id) {
        const updaterName = user.user_metadata?.full_name || "A team member";
        const orgId = (taskInfo as any)?.projects?.organization_id;
        await createNotification(
          taskInfo.created_by,
          "Task Completed",
          `${updaterName} completed the task: ${taskInfo.title}`,
          "task_completed",
          `/dashboard/projects/${taskInfo.project_id}?tab=tasks${orgId ? `&org=${orgId}` : ""}`,
        );
      }
    } catch (e) {
      console.error("Notify completion error", e);
    }
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

  // Strict Permission Check
  const { isCreator, isDeptManager, isCollaborator } = await getTaskPermissions(
    adminClient,
    taskId,
    user.id,
  );

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator) {
    return {
      error:
        "Permission denied. Only the task owner or department manager can change priority.",
    };
  }

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

export async function updateTaskDescription(
  taskId: string,
  description: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  // Strict Permission Check
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, taskId, user.id);

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

  const { data, error } = await adminClient
    .from("tasks")
    .update({ description })
    .eq("id", taskId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects`);
  return { success: true, data };
}

export async function updateTaskDueDate(
  taskId: string,
  dueDate: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  // Strict Permission Check
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, taskId, user.id);

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

  const { data, error } = await adminClient
    .from("tasks")
    .update({ due_date: dueDate })
    .eq("id", taskId)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects`);
  return { success: true, data };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  // Strict Permission Check
  const { isCreator, isDeptManager, isCollaborator } = await getTaskPermissions(
    adminClient,
    taskId,
    user.id,
  );

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator) {
    return { error: "Permission denied." };
  }

  // Clean up assignees and subtasks first
  await adminClient.from("task_assignees").delete().eq("task_id", taskId);
  await adminClient.from("task_subtasks").delete().eq("task_id", taskId);
  await adminClient.from("collaborators").delete().eq("task_id", taskId);
  await adminClient.from("task_reports").delete().eq("task_id", taskId);

  const { error } = await adminClient.from("tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/projects`);
  return { success: true };
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

  // Strict Permission Check
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, taskId, user.id);

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

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

  // Get task_id from subtask
  const { data: subtask } = await adminClient
    .from("task_subtasks")
    .select("task_id")
    .eq("id", subTaskId)
    .single();

  if (!subtask) return { error: "Subtask not found." };

  // Strict Permission Check
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, subtask.task_id, user.id);

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

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

  // Get task_id from subtask
  const { data: subtask } = await adminClient
    .from("task_subtasks")
    .select("task_id")
    .eq("id", subTaskId)
    .single();

  if (!subtask) return { error: "Subtask not found." };

  // Strict Permission Check: Only manager or creator can delete
  const { isCreator, isDeptManager, isCollaborator } = await getTaskPermissions(
    adminClient,
    subtask.task_id,
    user.id,
  );

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator) {
    return { error: "Permission denied." };
  }

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

  // Notify Assignee (if they are not the creator)
  if (assigneeId && assigneeId !== user.id) {
    // Get organization_id from project for the notification link
    const { data: proj } = await adminClient
      .from("projects")
      .select("organization_id")
      .eq("id", taskData.project_id)
      .single();

    const managerName = user.user_metadata?.full_name || "A manager";
    await createNotification(
      assigneeId,
      "New Task Assigned",
      `${managerName} assigned you a new task: ${taskData.title}`,
      "task_assigned",
      `/dashboard/projects/${taskData.project_id}?tab=tasks${proj?.organization_id ? `&org=${proj.organization_id}` : ""}`,
    );
  }

  revalidatePath("/dashboard/projects/[id]", "page");
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

  // Strict Permission Check — creator, dept manager, or assignee can add collaborators
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, taskId, user.id);

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

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

  // Note: Collaborators are NOT added to task_assignees.
  // They can still view the task via direct link but only have
  // permission to send reports, not modify task details.

  // Notify Collaborator (if they are not the adder)
  if (staffRow.user_id && staffRow.user_id !== user.id) {
    const adderName = user.user_metadata?.full_name || "A team member";
    // Get task title and org for the message
    const { data: task } = await adminClient
      .from("tasks")
      .select("title, project_id, projects(organization_id)")
      .eq("id", taskId)
      .single();

    const orgId = (task as any)?.projects?.organization_id;
    const projectId = task?.project_id;

    await createNotification(
      staffRow.user_id,
      "Added as Collaborator",
      `${adderName} added you as a collaborator on ${task?.title || "a task"}`,
      "task_assigned",
      projectId
        ? `/dashboard/projects/${projectId}?tab=tasks${orgId ? `&org=${orgId}` : ""}`
        : `/dashboard/tasks/${taskId}${orgId ? `?org=${orgId}` : ""}`,
    );
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

  // Strict Permission Check — creator, dept manager, or assignee can remove collaborators
  const { isCreator, isDeptManager, isAssignee, isCollaborator } =
    await getTaskPermissions(adminClient, taskId, user.id);

  if (isCollaborator) return { error: "Collaborators can only add reports." };

  if (!isDeptManager && !isCreator && !isAssignee) {
    return { error: "Permission denied." };
  }

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

    // Notify the removed collaborator
    const { data: task } = await adminClient
      .from("tasks")
      .select("title, project_id, projects(organization_id)")
      .eq("id", taskId)
      .single();

    const orgId = (task as any)?.projects?.organization_id;
    const projectId = task?.project_id;

    await createNotification(
      staffRow.user_id,
      "Removed from Task",
      `You have been removed from ${task?.title || "a task"}`,
      "task_assigned",
      projectId
        ? `/dashboard/projects/${projectId}?tab=tasks${orgId ? `&org=${orgId}` : ""}`
        : `/dashboard/tasks/${taskId}${orgId ? `?org=${orgId}` : ""}`,
    );
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}

/**
 * Fetch collaborators for a task, with full_name from staffs.
 * Excludes the primary assignee — if they're in the collaborators table
 * they should NOT appear in the collaborator list (they're an assignee).
 */
export async function getTaskCollaborators(taskId: string) {
  const adminClient = createAdminClient();

  // Get primary assignee user_ids for this task
  const { data: assignees } = await adminClient
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", taskId);

  // Get the staff_ids that correspond to assignee user_ids
  const assigneeUserIds = (assignees || [])
    .map((a: any) => a.user_id)
    .filter(Boolean);
  let assigneeStaffIds: string[] = [];
  if (assigneeUserIds.length > 0) {
    const { data: staffRows } = await adminClient
      .from("staffs")
      .select("id")
      .in("user_id", assigneeUserIds);
    assigneeStaffIds = (staffRows || []).map((s: any) => s.id);
  }

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

  // Filter out primary assignees from the collaborator list
  const filtered = (data || []).filter(
    (c: any) => !assigneeStaffIds.includes(c.staff_id),
  );

  return { data: filtered };
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
                staff_id,
                staffs (full_name)
            )
        `,
    )
    .eq("project_id", projectId);

  if (tasksError) {
    return { error: tasksError.message, data: [] };
  }

  return { data: tasksData || [] };
}

export async function getTaskById(taskId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Try Organizational Tasks
  const { data: orgTask, error: orgError } = await adminClient
    .from("organization_tasks")
    .select(
      `
      id,
      title,
      description,
      due_date,
      status,
      created_at,
      created_by,
      organization_id,
      organizations(name, manager_staff_id),
      org_task_assignees(
        staffs(id, full_name, email)
      ),
      org_task_attachments(id)
    `,
    )
    .eq("id", taskId)
    .maybeSingle();

  if (orgTask) {
    return {
      data: {
        id: orgTask.id,
        title: orgTask.title,
        description: orgTask.description || "",
        status: orgTask.status,
        priority: "medium",
        due_date: orgTask.due_date || "",
        assignees:
          orgTask.org_task_assignees
            ?.map((a: any) => a?.staffs?.full_name)
            .filter(Boolean) || [],
        assignee_ids:
          orgTask.org_task_assignees
            ?.map((a: any) => a?.staffs?.id)
            .filter(Boolean) || [],
        attachments_count: orgTask.org_task_attachments?.length || 0,
        comments_count: 0,
        is_project_task: false,
        organization_id: orgTask.organization_id,
        org_name: (orgTask.organizations as any)?.name,
        dept_manager_id: (orgTask.organizations as any)?.manager_staff_id,
        created_by: orgTask.created_by,
        created_at: orgTask.created_at,
      } as any,
    };
  }

  // 2. Try Project Tasks
  const { data: pTask, error: pError } = await adminClient
    .from("tasks")
    .select(
      `
      *,
      projects(organization_id, name, organizations(name, manager_staff_id)),
      task_assignees(user_id),
      collaborators(staff_id)
    `,
    )
    .eq("id", taskId)
    .maybeSingle();

  if (pTask) {
    // Need names for display, so fetch all staff (standard pattern in this app)
    const { data: allStaff } = await adminClient
      .from("staffs")
      .select("id, user_id, full_name, email");

    const staffByUserId = (allStaff || []).reduce((acc: any, s: any) => {
      if (s.user_id) acc[s.user_id] = s;
      return acc;
    }, {});

    const staffById = (allStaff || []).reduce((acc: any, s: any) => {
      acc[s.id] = s;
      return acc;
    }, {});

    return {
      data: {
        ...pTask,
        is_project_task: true,
        project_name: pTask.projects?.name,
        org_name: (pTask.projects?.organizations as any)?.name,
        dept_manager_id: (pTask.projects?.organizations as any)
          ?.manager_staff_id,
        assignees:
          pTask.task_assignees
            ?.map((a: any) => staffByUserId[a.user_id]?.full_name)
            .filter(Boolean) || [],
        assignee_ids:
          pTask.task_assignees?.map((a: any) => a.user_id).filter(Boolean) ||
          [],
        collaborator_user_ids:
          pTask.collaborators
            ?.map((c: any) => staffById[c.staff_id]?.user_id)
            .filter(Boolean) || [],
      } as any,
    };
  }

  return { error: "Task not found", data: null };
}
