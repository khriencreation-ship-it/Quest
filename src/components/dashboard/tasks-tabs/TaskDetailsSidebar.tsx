"use client";

import React, { useEffect } from "react";
import {
  X,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  Clock,
  AlignLeft,
  BarChart2,
  AlertCircle,
  User,
  UserPlus,
} from "lucide-react";
import { Task, SubTask, TaskStatus, TaskPriority } from "@/types/kanban-types";
import type {
  StaffMember,
  Collaborator,
  TaskDetailsSidebarProps,
} from "@/types/task-details.types";
import {
  useSubtasks,
  useCollaborators,
  useTaskControls,
} from "@/hooks/task-details";

function ErrorBanner({ error }: { error: string }) {
  return (
    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
      <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-bold text-rose-700">Database Issue</p>
        <p className="text-xs text-rose-600 leading-relaxed">{error}</p>
      </div>
    </div>
  );
}

function TaskHeader({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
          {task.title.substring(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">
              {task.is_project_task ? "Project Task" : "Workspace Task"}
            </span>
            {task.is_project_task && task.project_name && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {task.project_name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
            {task.title}
          </h2>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-90"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

function DescriptionSection({ task }: { task: Task }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-400">
        <AlignLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Description
        </span>
      </div>
      <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[24px] text-[15px] text-gray-600 leading-relaxed min-h-[120px] transition-colors hover:bg-gray-50">
        {task.description || (
          <span className="italic text-gray-300">
            No description provided. Click to add...
          </span>
        )}
      </div>
    </div>
  );
}

function WorkspaceTaskPlaceholder() {
  return (
    <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center p-10 bg-gray-50/30">
      <AlertCircle className="w-8 h-8 text-gray-200 mb-4" />
      <h3 className="font-bold text-gray-900 text-sm">
        Workspace Coordination Task
      </h3>
      <p className="text-xs text-gray-500 mt-2 max-w-[200px] leading-relaxed">
        This is an internal organizational task. Use the Project view for
        advanced features like sub-tasks and priority management.
      </p>
    </div>
  );
}

function ChecklistSection({
  task,
  subTasks,
  loadingSubTasks,
  newSubTaskTitle,
  isAddingSubTask,
  progressPercentage,
  onToggleSubTask,
  onDeleteSubTask,
  onNewTitleChange,
  onAddSubTask,
}: {
  task: Task;
  subTasks: SubTask[];
  loadingSubTasks: boolean;
  newSubTaskTitle: string;
  isAddingSubTask: boolean;
  progressPercentage: number;
  onToggleSubTask: (id: string, completed: boolean) => void;
  onDeleteSubTask: (id: string) => void;
  onNewTitleChange: (value: string) => void;
  onAddSubTask: (e: React.FormEvent) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Checklist
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            {progressPercentage}% Done
          </span>
        </div>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-emerald-500 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="max-h-[240px] overflow-y-auto no-scrollbar space-y-2.5">
        {loadingSubTasks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : subTasks.length === 0 ? (
          <div className="group py-12 px-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-3 transition-colors hover:border-emerald-100 hover:bg-emerald-50/20">
            <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
              <Plus className="w-6 h-6 text-gray-300 group-hover:text-emerald-500" />
            </div>
            <p className="text-sm text-gray-400 font-medium tracking-tight">
              Add your first sub-task below
            </p>
          </div>
        ) : (
          subTasks.map((st) => (
            <div
              key={st.id}
              className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggleSubTask(st.id, !st.completed)}
                  className="transition-transform active:scale-90"
                >
                  {st.completed ? (
                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-200 rounded-lg group-hover:border-emerald-400 transition-colors" />
                  )}
                </button>
                <span
                  className={`text-[15px] font-medium transition-all ${
                    st.completed
                      ? "text-gray-400 line-through"
                      : "text-gray-700"
                  }`}
                >
                  {st.title}
                </span>
              </div>
              <button
                onClick={() => onDeleteSubTask(st.id)}
                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onAddSubTask} className="relative group pt-2">
        <input
          type="text"
          placeholder="Add a new sub-task..."
          value={newSubTaskTitle}
          onChange={(e) => onNewTitleChange(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent rounded-[20px] text-[15px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 focus:bg-white transition-all placeholder:text-gray-400 font-medium shadow-sm hover:bg-gray-50"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
          {isAddingSubTask ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </div>
      </form>
    </div>
  );
}

function SidebarControls({
  task,
  updatingStatus,
  updatingPriority,
  onStatusChange,
  onPriorityChange,
}: {
  task: Task;
  updatingStatus: boolean;
  updatingPriority: boolean;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
}) {
  return (
    <>
      {/* Status */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-400">
          <BarChart2 className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Status
          </span>
        </div>
        <div className="relative group">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            disabled={updatingStatus}
            className="w-full pl-4 pr-10 py-3 bg-white border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer hover:border-emerald-200"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <X className="w-4 h-4 rotate-45" />
          </div>
        </div>
      </div>

      {/* Priority - Only for Project Tasks */}
      {task.is_project_task && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Priority
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => onPriorityChange(p)}
                disabled={updatingPriority}
                className={`py-2 rounded-xl text-[11px] font-bold uppercase tracking-tighter transition-all border-2 ${
                  task.priority === p
                    ? p === "high"
                      ? "bg-rose-50 border-rose-500 text-rose-600 shadow-sm shadow-rose-100"
                      : p === "medium"
                        ? "bg-amber-50 border-amber-500 text-amber-600 shadow-sm shadow-amber-100"
                        : "bg-sky-50 border-sky-500 text-sky-600 shadow-sm shadow-sky-100"
                    : "bg-white border-gray-50 text-gray-400 hover:border-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AssigneeSection({ task }: { task: Task }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-400">
        <User className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Assignee
        </span>
      </div>
      {task.assignees.length > 0 ? (
        <div className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl flex items-center gap-2 shadow-sm w-fit">
          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">
            {task.assignees[0][0].toUpperCase()}
          </div>
          <span className="text-xs font-bold text-gray-700">
            {task.assignees[0]}
          </span>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No assignee.</p>
      )}
    </div>
  );
}

function CollaboratorsSection({
  task,
  collaborators,
  loadingCollaborators,
  staff,
  selectedCollaboratorId,
  isAddingCollaborator,
  onCollaboratorSelect,
  onAddCollaborator,
  onRemoveCollaborator,
}: {
  task: Task;
  collaborators: Collaborator[];
  loadingCollaborators: boolean;
  staff: StaffMember[];
  selectedCollaboratorId: string;
  isAddingCollaborator: boolean;
  onCollaboratorSelect: (id: string) => void;
  onAddCollaborator: () => void;
  onRemoveCollaborator: (staffId: string) => void;
}) {
  const avatarColors = [
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-sky-100", text: "text-sky-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
  ];

  // Staff not yet added as a collaborator
  const available = staff.filter(
    (s) => !collaborators.some((c) => c.staff_id === s.id),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <User className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Collaborators
          </span>
        </div>
        {collaborators.length > 0 && (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {collaborators.length}
          </span>
        )}
      </div>

      {/* Current collaborators — compact avatar row */}
      {loadingCollaborators ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      ) : collaborators.length > 0 ? (
        <div className="max-h-[120px] overflow-y-auto no-scrollbar space-y-1.5 pr-1">
          {collaborators.map((c, i) => (
            <div
              key={c.id}
              className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length].bg} ${avatarColors[i % avatarColors.length].text} flex items-center justify-center text-[10px] font-bold shrink-0`}
              >
                {(c.full_name || "?")[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-gray-700 truncate flex-1">
                {c.full_name}
              </span>
              <button
                type="button"
                onClick={() => onRemoveCollaborator(c.staff_id)}
                className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                title="Remove collaborator"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No collaborators yet.</p>
      )}

      {/* Add collaborator — always visible */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex-1">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={selectedCollaboratorId}
            onChange={(e) => onCollaboratorSelect(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>
              {available.length === 0
                ? "All members added"
                : "Select member..."}
            </option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onAddCollaborator}
          disabled={
            available.length === 0 ||
            !selectedCollaboratorId ||
            isAddingCollaborator
          }
          className="shrink-0 p-2 rounded-xl bg-[#2eb781] text-white hover:bg-[#279e6f] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add collaborator"
        >
          {isAddingCollaborator ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function DueDateSection({ task }: { task: Task }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-400">
        <Clock className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Due Date
        </span>
      </div>
      <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <span className="text-sm font-bold text-gray-700">
          {task.due_date
            ? new Date(task.due_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No deadline"}
        </span>
      </div>
    </div>
  );
}

function Footer({ isActive }: { isActive: boolean }) {
  return (
    <div className="px-8 py-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
        <Loader2
          className={`w-3 h-3 text-emerald-500 ${isActive ? "animate-spin" : ""}`}
        />
        Cloud Synchronized: Quest Workspace
      </p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[9px] font-bold text-emerald-500 uppercase">
          Live
        </span>
      </div>
    </div>
  );
}
/* ──────────────────────────────────────────
   Main Component
   ────────────────────────────────────────── */
export default function TaskDetailsSidebar({
  isOpen,
  onClose,
  task,
  onUpdateTask,
  staff = [],
}: TaskDetailsSidebarProps) {
  const {
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
  } = useSubtasks();

  const {
    collaborators,
    setCollaborators,
    loadingCollaborators,
    selectedCollaboratorId,
    setSelectedCollaboratorId,
    isAddingCollaborator,
    loadCollaborators,
    handleAddCollaborator,
    handleRemoveCollaborator,
  } = useCollaborators();

  const {
    updatingStatus,
    updatingPriority,
    handleStatusChange,
    handlePriorityChange,
  } = useTaskControls(onUpdateTask);

  useEffect(() => {
    if (task && isOpen) {
      setError(null);
      loadSubTasks(task.id, !!task.is_project_task);
      loadCollaborators(task.id);
    } else {
      setSubTasks([]);
      setError(null);
      setCollaborators([]);
    }
  }, [task, isOpen]);

  if (!task) return null;
  console.log(task);
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-md z-60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] z-70 flex flex-col rounded-[32px] overflow-hidden transform transition-all duration-300 ease-out fill-mode-forwards ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <TaskHeader task={task} onClose={onClose} />

        <div className="flex-1 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-0">
            {/* Main Content (Left) */}
            <div className="lg:col-span-8 overflow-y-auto no-scrollbar p-8 border-r border-gray-50 bg-white">
              <div className="space-y-10">
                {error && <ErrorBanner error={error} />}
                <DescriptionSection task={task} />
                {task.is_project_task ? (
                  <ChecklistSection
                    task={task}
                    subTasks={subTasks}
                    loadingSubTasks={loadingSubTasks}
                    newSubTaskTitle={newSubTaskTitle}
                    isAddingSubTask={isAddingSubTask}
                    progressPercentage={progressPercentage}
                    onToggleSubTask={(id, completed) =>
                      handleToggleSubTask(id, completed, task, onUpdateTask)
                    }
                    onDeleteSubTask={(id) =>
                      handleDeleteSubTask(id, task, onUpdateTask)
                    }
                    onNewTitleChange={setNewSubTaskTitle}
                    onAddSubTask={(e) =>
                      handleAddSubTask(e, task, onUpdateTask)
                    }
                  />
                ) : (
                  <WorkspaceTaskPlaceholder />
                )}
              </div>
            </div>

            {/* Sidebar Column (Right) */}
            <div className="lg:col-span-4 bg-gray-50/30 p-6 space-y-4 border-l border-gray-50 overflow-y-auto no-scrollbar">
              <SidebarControls
                task={task}
                updatingStatus={updatingStatus}
                updatingPriority={updatingPriority}
                onStatusChange={(s) => handleStatusChange(task, s)}
                onPriorityChange={(p) => handlePriorityChange(task, p)}
              />
              <div className="space-y-6 pt-4">
                <DueDateSection task={task} />
                <AssigneeSection task={task} />
                <CollaboratorsSection
                  task={task}
                  collaborators={collaborators}
                  loadingCollaborators={loadingCollaborators}
                  staff={staff}
                  selectedCollaboratorId={selectedCollaboratorId}
                  isAddingCollaborator={isAddingCollaborator}
                  onCollaboratorSelect={setSelectedCollaboratorId}
                  onAddCollaborator={() => handleAddCollaborator(task.id)}
                  onRemoveCollaborator={(staffId) =>
                    handleRemoveCollaborator(task.id, staffId)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer isActive={isAddingSubTask || loadingSubTasks} />
      </div>
    </>
  );
}
