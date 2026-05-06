"use client";

import { useState } from "react";
import type { TaskStatus, TaskPriority } from "@/types/kanban-types";
import type { Task } from "@/types/kanban-types";
import {
  changeTaskStatus,
  changeTaskPriority,
} from "@/services/task-details.service";

export function useTaskControls(onUpdateTask: (task: Task) => void) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

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

  return {
    updatingStatus,
    updatingPriority,
    handleStatusChange,
    handlePriorityChange,
  };
}
