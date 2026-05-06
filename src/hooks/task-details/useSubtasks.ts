"use client";

import { useState } from "react";
import type { Task, SubTask } from "@/types/kanban-types";
import {
  fetchSubTasks,
  addSubTask,
  toggleSubTaskCompleted,
  removeSubTask,
} from "@/services/task-details.service";

export function useSubtasks() {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [loadingSubTasks, setLoadingSubTasks] = useState(false);
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubTasks = async (taskId: string, isProjectTask: boolean) => {
    if (!isProjectTask) return;
    setLoadingSubTasks(true);
    const { data, error: fetchError } = await fetchSubTasks(taskId);
    if (fetchError) {
      setError(fetchError);
    } else if (data) {
      setSubTasks(data as SubTask[]);
    }
    setLoadingSubTasks(false);
  };

  const handleAddSubTask = async (
    e: React.FormEvent,
    task: Task,
    onUpdateTask: (task: Task) => void,
  ) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim()) return;

    setError(null);
    setIsAddingSubTask(true);
    const result = await addSubTask(task.id, newSubTaskTitle.trim());
    if (result.success && result.data) {
      const newSub = result.data as SubTask;
      const updatedSubTasks = [...subTasks, newSub];
      setSubTasks(updatedSubTasks);
      setNewSubTaskTitle("");

      onUpdateTask({
        ...task,
        sub_tasks: updatedSubTasks,
        total_subtasks: updatedSubTasks.length,
        completed_subtasks: updatedSubTasks.filter((s) => s.completed).length,
      });
    } else if (result.error) {
      setError(result.error);
    }
    setIsAddingSubTask(false);
  };

  const handleToggleSubTask = async (
    subTaskId: string,
    completed: boolean,
    task: Task,
    onUpdateTask: (task: Task) => void,
  ) => {
    const updatedSubTasks = subTasks.map((st) =>
      st.id === subTaskId ? { ...st, completed } : st,
    );
    setSubTasks(updatedSubTasks);

    const result = await toggleSubTaskCompleted(subTaskId, completed);
    if (!result.success) {
      loadSubTasks(task.id, !!task.is_project_task);
    } else {
      onUpdateTask({
        ...task,
        sub_tasks: updatedSubTasks,
        completed_subtasks: updatedSubTasks.filter((s) => s.completed).length,
      });
    }
  };

  const handleDeleteSubTask = async (
    subTaskId: string,
    task: Task,
    onUpdateTask: (task: Task) => void,
  ) => {
    const updatedSubTasks = subTasks.filter((st) => st.id !== subTaskId);
    setSubTasks(updatedSubTasks);

    const result = await removeSubTask(subTaskId);
    if (!result.success) {
      loadSubTasks(task.id, !!task.is_project_task);
    } else {
      onUpdateTask({
        ...task,
        sub_tasks: updatedSubTasks,
        total_subtasks: updatedSubTasks.length,
        completed_subtasks: updatedSubTasks.filter((s) => s.completed).length,
      });
    }
  };

  const progressPercentage =
    subTasks.length > 0
      ? Math.round(
          (subTasks.filter((st) => st.completed).length / subTasks.length) *
            100,
        )
      : 0;

  return {
    subTasks,
    setSubTasks,
    newSubTaskTitle,
    setNewSubTaskTitle,
    loadingSubTasks,
    isAddingSubTask,
    error,
    setError,
    progressPercentage,
    loadSubTasks,
    handleAddSubTask,
    handleToggleSubTask,
    handleDeleteSubTask,
  };
}
