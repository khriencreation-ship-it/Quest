// ── Task Details Sidebar Types ──────────────────────────

import type { Task } from "./kanban-types";

/** A staff member record (from staffs table). */
export type StaffMember = {
  id: string; // staffs.id
  user_id: string; // auth user id
  full_name: string;
  role_name?: string;
};

/** Flat collaborator — what the UI uses. staff_id for removal, rest from staffs. */
export type Collaborator = StaffMember & { staff_id: string };

/**
 * Raw row returned by getTaskCollaborators.
 * `staffs` is a single joined object (not an array) because the FK is one-to-one.
 */
export type CollaboratorRow = {
  id: string;
  staff_id: string;
  staffs: { id: string; full_name: string; user_id: string } | null;
};

export interface TaskDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (task: Task) => void;
  /** Project staff — used to populate the Add Collaborator dropdown */
  staff?: StaffMember[];
}
