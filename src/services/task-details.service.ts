// ── Task Details Service ────────────────────────────────
// Thin wrappers around server actions — keeps the UI
// decoupled from the API layer.

import {
  getSubTasks,
  createSubTask,
  toggleSubTask,
  deleteSubTask,
  updateTaskPriority,
  updateTaskStatus,
  addTaskCollaborator,
  removeTaskCollaborator,
  getTaskCollaborators,
  updateTaskDescription,
  updateTaskDueDate,
  deleteTask,
} from "@/app/actions/tasks";
import { updateOrgTaskStatus } from "@/app/actions/org_tasks";

/* ── Sub-tasks ─────────────────────────────── */

export const fetchSubTasks = (taskId: string) => getSubTasks(taskId);

export const addSubTask = (taskId: string, title: string) =>
  createSubTask(taskId, title);

export const toggleSubTaskCompleted = (subTaskId: string, completed: boolean) =>
  toggleSubTask(subTaskId, completed);

export const removeSubTask = (subTaskId: string) => deleteSubTask(subTaskId);

/* ── Collaborators ──────────────────────────── */

export const fetchCollaborators = (taskId: string) =>
  getTaskCollaborators(taskId);

export const addCollaborator = (taskId: string, staffId: string) =>
  addTaskCollaborator(taskId, staffId);

export const removeCollaborator = (taskId: string, staffId: string) =>
  removeTaskCollaborator(taskId, staffId);

/* ── Task Controls ──────────────────────────── */

export const changeTaskStatus = (
  taskId: string,
  newStatus: string,
  isProjectTask: boolean,
) =>
  isProjectTask
    ? updateTaskStatus(taskId, newStatus)
    : updateOrgTaskStatus(taskId, newStatus);

export const changeTaskPriority = (taskId: string, priority: string) =>
  updateTaskPriority(taskId, priority);

export const changeTaskDescription = (taskId: string, description: string) =>
  updateTaskDescription(taskId, description);

export const changeTaskDueDate = (taskId: string, dueDate: string | null) =>
  updateTaskDueDate(taskId, dueDate);

export const removeTask = (taskId: string) => deleteTask(taskId);
