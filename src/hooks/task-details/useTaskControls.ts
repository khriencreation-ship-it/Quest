"use client";

import { useState } from "react";
import type { TaskStatus, TaskPriority } from "@/types/kanban-types";
import type { Task } from "@/types/kanban-types";
import {
  changeTaskStatus,
  changeTaskPriority,
  changeTaskDescription,
  changeTaskDueDate,
  removeTask,
} from "@/services/task-details.service";

export function useTaskControls(onUpdateTask: (task: Task) => void) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingDescription, setUpdatingDescription] = useState(false);
  const [updatingDueDate, setUpdatingDueDate] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    setUpdatingStatus(true);
    const result = await changeTaskStatus(
      task.id,
      newStatus,
      !!task.is_project_task,
    );
    if (!result.error) {
      onUpdateTask({ ...task, status: newStatus });
    }
    setUpdatingStatus(false);
  };

  const handlePriorityChange = async (task: Task, newPriority: TaskPriority) => {
    setUpdatingPriority(true);
    const result = await changeTaskPriority(task.id, newPriority);
    if (result.success) {
      onUpdateTask({ ...task, priority: newPriority });
    }
    setUpdatingPriority(false);
  };

  const handleDescriptionChange = async (task: Task, newDescription: string) => {
    setUpdatingDescription(true);
    const result = await changeTaskDescription(task.id, newDescription);
    if (result.success) {
      onUpdateTask({ ...task, description: newDescription });
    }
    setUpdatingDescription(false);
    return result;
  };

  const handleDueDateChange = async (task: Task, newDueDate: string | null) => {
    setUpdatingDueDate(true);
    const result = await changeTaskDueDate(task.id, newDueDate);
    if (result.success) {
      onUpdateTask({ ...task, due_date: newDueDate || "" });
    }
    setUpdatingDueDate(false);
    return result;
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTask(true);
    const result = await removeTask(taskId);
    setDeletingTask(false);
    return result;
  };

  return {
    updatingStatus,
    updatingPriority,
    updatingDescription,
    updatingDueDate,
    deletingTask,
    handleStatusChange,
    handlePriorityChange,
    handleDescriptionChange,
    handleDueDateChange,
    handleDeleteTask,
  };
}
