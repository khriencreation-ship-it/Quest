"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Collaborator, CollaboratorRow } from "@/types/task-details.types";
import {
  fetchCollaborators,
  addCollaborator,
  removeCollaborator,
} from "@/services/task-details.service";

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("");
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  const loadCollaborators = async (taskId: string) => {
    setLoadingCollaborators(true);
    try {
      const { data, error } = await fetchCollaborators(taskId);
      if (error) {
        console.error("Failed to fetch collaborators:", error);
        return;
      }
      if (!data || data.length === 0) {
        setCollaborators([]);
        return;
      }
      const formatted: Collaborator[] = (data as CollaboratorRow[])
        .filter((c) => c.staffs != null)
        .map((c) => ({
          id: c.staffs!.id,
          user_id: c.staffs!.user_id,
          full_name: c.staffs!.full_name,
          staff_id: c.staff_id,
        }));
      setCollaborators(formatted);
    } catch (err) {
      console.error("Unexpected error fetching collaborators:", err);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleAddCollaborator = async (taskId: string) => {
    if (!selectedCollaboratorId) return;
    setIsAddingCollaborator(true);
    const result = await addCollaborator(taskId, selectedCollaboratorId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Collaborator added");
      await loadCollaborators(taskId);
      setSelectedCollaboratorId("");
    }
    setIsAddingCollaborator(false);
  };

  const handleRemoveCollaborator = async (taskId: string, staffId: string) => {
    const result = await removeCollaborator(taskId, staffId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Collaborator removed");
      await loadCollaborators(taskId);
    }
  };

  return {
    collaborators,
    setCollaborators,
    loadingCollaborators,
    selectedCollaboratorId,
    setSelectedCollaboratorId,
    isAddingCollaborator,
    loadCollaborators,
    handleAddCollaborator,
    handleRemoveCollaborator,
  };
}
