"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
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
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Task, SubTask, TaskStatus, TaskPriority } from "@/types/kanban-types";
import type { StaffMember, Collaborator } from "@/types/task-details.types";
import {
  getTaskReports,
  addTaskReport,
  TaskReport,
} from "@/app/actions/task_reports";
import {
  useSubtasks,
  useCollaborators,
  useTaskControls,
} from "@/hooks/task-details";

import { createClient } from "@/utils/supabase/client";

interface TaskDetailViewProps {
  task: Task;
  staff: StaffMember[];
  isManager?: boolean;
  onUpdateTask?: (updatedTask: Task) => void;
}

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

export default function TaskDetailView({
  task: initialTask,
  staff = [],
  isManager = false,
  onUpdateTask,
}: TaskDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");
  const [task, setLocalTask] = useState<Task>(initialTask);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const handleLocalUpdate = (updatedTask: Task) => {
    setLocalTask(updatedTask);
    if (onUpdateTask) onUpdateTask(updatedTask);
  };

  const {
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
  } = useTaskControls(handleLocalUpdate);

  // Wait for auth to resolve before allowing non-manager permissions
  const userIdLoaded = currentUserId !== null;

  // Resolve current staff ID to check against dept_manager_id
  const currentUserStaff = staff.find((s) => s.user_id === currentUserId);
  const currentStaffId = currentUserStaff?.id;

  const isCreator = userIdLoaded && currentUserId === task.created_by;
  const isDeptManager = !!(
    currentStaffId && currentStaffId === (task as any).dept_manager_id
  );

  // High-level "Owner" access (Creator or Dept Manager)
  const isOwnerOrDeptManager = isCreator || isDeptManager;

  // Check if user is in the assignee list (primary assignee)
  const isAssignee =
    userIdLoaded && (task.assignee_ids?.includes(currentUserId) ?? false);

  // A collaborator is someone in the collaborator_user_ids list (provided by server)
  // BUT if they are also a primary assignee, they are NOT treated as a collaborator.
  // Assignees always retain their full assignee privileges.
  const isCollaboratorOnly =
    userIdLoaded &&
    !isAssignee &&
    ((task as any).collaborator_user_ids?.includes(currentUserId) ?? false);

  // A primary assignee is someone assigned to the task who is NOT the owner/dept-manager
  const isPrimaryAssignee = !isOwnerOrDeptManager && isAssignee;

  // Restricted means they can ONLY add reports
  // This applies to collaborator-only users and uninvolved managers.
  const isRestricted =
    isCollaboratorOnly || (!isOwnerOrDeptManager && !isPrimaryAssignee);

  // Can modify status/subtasks? Only owner/dept-manager or primary assignee.
  const canUpdateProgress =
    userIdLoaded && (isOwnerOrDeptManager || isPrimaryAssignee);

  // Full edit access (Priority, Description, Due Date, Collaborators)
  const canEditTaskDetails = userIdLoaded && isOwnerOrDeptManager;

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    task.description || "",
  );

  const [reports, setReports] = useState<TaskReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [newReport, setNewReport] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);

  const loadReports = async () => {
    setLoadingReports(true);
    const data = await getTaskReports(task.id);
    setReports(data);
    setLoadingReports(false);
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.trim()) return;

    setIsSendingReport(true);
    const result = await addTaskReport(task.id, newReport);
    if (result.success) {
      setNewReport("");
      loadReports();
    } else {
      setError(result.error || "Failed to add report");
    }
    setIsSendingReport(false);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (task) {
      setError(null);
      loadSubTasks(task.id, !!task.is_project_task);
      loadCollaborators(task.id);
      loadReports();
    }
  }, [task.id]);

  const avatarColors = [
    { bg: "bg-violet-100", text: "text-violet-700" },
    { bg: "bg-sky-100", text: "text-sky-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
  ];

  const availableStaff = staff.filter((s) => {
    // 1. Not already a collaborator
    const isAlreadyCollab = collaborators.some((c) => c.staff_id === s.id);
    if (isAlreadyCollab) return false;

    // 2. Not the task owner (the person who created it)
    if (s.user_id === task.created_by) return false;

    // 3. Not the current user (safety check)
    if (s.user_id === currentUserId) return false;

    // 4. Not the department manager
    if (s.id === (task as any).dept_manager_id) return false;

    // 5. Not a primary assignee (they already have higher permissions)
    if (task.assignee_ids?.includes(s.user_id)) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-2 animate-in fade-in duration-500">
      {/* Breadcrumbs / Back button */}
      <div className="mb-4">
        <Link
          href={
            (task as any).project_id
              ? `/dashboard/projects/${(task as any).project_id}?org=${orgId || (task as any).organization_id || ""}&tab=tasks`
              : `/dashboard/tasks${orgId ? `?org=${orgId}` : ""}`
          }
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Tasks
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#2eb781] text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#2eb781]/20 shrink-0">
                  {task.title.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                      {task.is_project_task ? "Project Task" : "Workspace Task"}
                    </span>
                    {(task as any).org_name && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {(task as any).org_name}
                      </span>
                    )}
                    {task.is_project_task && task.project_name && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        {task.project_name}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {task.title}
                  </h1>
                </div>
              </div>

              {canEditTaskDetails && (
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      const res = await handleDeleteTask(task.id);
                      if (res.success) {
                        router.push("/dashboard/projects");
                      } else {
                        setError(res.error || "Failed to delete task");
                      }
                    }
                  }}
                  disabled={deletingTask}
                  className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Delete Task"
                >
                  {deletingTask ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-8">
                <ErrorBanner error={error} />
              </div>
            )}

            <div className="space-y-10">
              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <AlignLeft className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Description
                  </span>
                </div>
                <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[24px] text-[15px] text-gray-600 leading-relaxed min-h-[120px] relative group">
                  {isEditingDescription ? (
                    <div className="space-y-4">
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all min-h-[150px]"
                        placeholder="Write a description..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsEditingDescription(false);
                            setEditedDescription(task.description || "");
                          }}
                          className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            const res = await handleDescriptionChange(
                              task,
                              editedDescription,
                            );
                            if (res.success) setIsEditingDescription(false);
                          }}
                          disabled={updatingDescription}
                          className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                          {updatingDescription && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {task.description || (
                        <span className="italic text-gray-300">
                          No description provided.
                        </span>
                      )}
                      {!canEditTaskDetails && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          Read Only
                        </div>
                      )}
                      {canEditTaskDetails && (
                        <button
                          onClick={() => setIsEditingDescription(true)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm rounded-lg border border-gray-100"
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Checklist */}
              {task.is_project_task ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Checklist
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {progressPercentage}% Done
                    </span>
                  </div>

                  <div
                    className={`h-2.5 w-full bg-gray-100 rounded-full overflow-hidden ${!canUpdateProgress ? "opacity-50 grayscale-[0.5]" : ""}`}
                  >
                    <div
                      className="h-full bg-[#2eb781] transition-all duration-700 ease-in-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {loadingSubTasks ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#2eb781] animate-spin" />
                      </div>
                    ) : subTasks.length === 0 ? (
                      <div className="py-12 px-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-3 bg-gray-50/30">
                        <Plus className="w-6 h-6 text-gray-300" />
                        <p className="text-sm text-gray-400 font-medium">
                          No sub-tasks yet
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
                              onClick={() => {
                                if (!canUpdateProgress) return;
                                handleToggleSubTask(
                                  st.id,
                                  !st.completed,
                                  task,
                                  handleLocalUpdate,
                                );
                              }}
                              disabled={!canUpdateProgress}
                              className={`transition-transform ${!canUpdateProgress ? "cursor-not-allowed opacity-50" : "active:scale-90"}`}
                            >
                              {st.completed ? (
                                <div className="w-6 h-6 bg-[#2eb781] rounded-lg flex items-center justify-center text-white shadow-sm shadow-[#2eb781]/20">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-200 rounded-lg group-hover:border-[#2eb781] transition-colors" />
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
                          {canUpdateProgress && (
                            <button
                              onClick={() =>
                                handleDeleteSubTask(
                                  st.id,
                                  task,
                                  handleLocalUpdate,
                                )
                              }
                              className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {canUpdateProgress ? (
                    <form
                      onSubmit={(e) =>
                        handleAddSubTask(e, task, handleLocalUpdate)
                      }
                      className="relative pt-2"
                    >
                      <input
                        type="text"
                        placeholder="Add a new sub-task..."
                        value={newSubTaskTitle}
                        onChange={(e) => setNewSubTaskTitle(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent rounded-[20px] text-[15px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/10 focus:border-[#2eb781]/30 focus:bg-white transition-all placeholder:text-gray-400 font-medium"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {isAddingSubTask ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="relative pt-2 opacity-50 cursor-not-allowed grayscale-[0.5]">
                      <div className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-[20px] text-[15px] text-gray-400 font-medium select-none">
                        Only assignees can add sub-tasks
                      </div>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center p-10 bg-gray-50/30">
                  <AlertCircle className="w-8 h-8 text-gray-200 mb-4" />
                  <h3 className="font-bold text-gray-900 text-sm">
                    Workspace Coordination Task
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm leading-relaxed">
                    This is an internal organizational task. Sub-tasks and
                    priority management are available for Project Tasks.
                  </p>
                </div>
              )}
            </div>

            {/* Progress Reports (Chat) Section */}
            <div className="pt-8 border-t border-gray-100 mt-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <BarChart2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Progress Reports
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400">
                    {reports.length} Updates
                  </span>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#2eb781] animate-spin" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="py-10 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
                      <p className="text-sm text-gray-400 font-medium">
                        No progress reports yet.
                      </p>
                      <p className="text-[11px] text-gray-300 mt-1">
                        Start the conversation by adding an update below.
                      </p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {report.sender_name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(report.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-600 leading-relaxed">
                          {report.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendReport} className="relative pt-2">
                  <textarea
                    placeholder="Type a progress update or message..."
                    value={newReport}
                    onChange={(e) => setNewReport(e.target.value)}
                    rows={2}
                    className="w-full pl-4 pr-16 py-4 bg-gray-50/50 border border-transparent rounded-[24px] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/10 focus:border-[#2eb781]/30 focus:bg-white transition-all placeholder:text-gray-400 font-medium resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReport || !newReport.trim()}
                    className="absolute right-3 bottom-3 p-3 bg-[#2eb781] text-white rounded-2xl hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-lg shadow-[#2eb781]/20 active:scale-95"
                  >
                    {isSendingReport ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm space-y-8">
            {/* Status & Priority Controls */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <BarChart2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Status
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task, e.target.value as TaskStatus)
                    }
                    disabled={updatingStatus || !canUpdateProgress}
                    className={`w-full pl-4 pr-10 py-3 bg-gray-50 border border-transparent rounded-2xl text-[14px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all appearance-none cursor-pointer hover:bg-gray-100 ${!canUpdateProgress ? "opacity-40 grayscale-[0.5] cursor-not-allowed" : ""}`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <div
                    className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${!canUpdateProgress ? "text-gray-300" : "text-gray-400"}`}
                  >
                    <BarChart2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

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
                        onClick={() => handlePriorityChange(task, p)}
                        disabled={updatingPriority || !canEditTaskDetails}
                        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2 ${
                          task.priority === p
                            ? p === "high"
                              ? "bg-rose-50 border-rose-500 text-rose-600 shadow-sm"
                              : p === "medium"
                                ? "bg-amber-50 border-amber-500 text-amber-600 shadow-sm"
                                : "bg-sky-50 border-sky-500 text-sky-600 shadow-sm"
                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                        } ${!canEditTaskDetails ? "cursor-not-allowed opacity-40 grayscale-[0.5]" : ""}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-gray-50" />

            {/* Task Meta */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Due Date
                  </span>
                </div>
                {canEditTaskDetails ? (
                  <div className="relative">
                    <input
                      type="date"
                      value={
                        task.due_date
                          ? new Date(task.due_date).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={async (e) => {
                        await handleDueDateChange(task, e.target.value || null);
                      }}
                      disabled={updatingDueDate}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer hover:bg-gray-100"
                    />
                    {updatingDueDate && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-sm text-gray-400 opacity-40 grayscale-[0.5] cursor-not-allowed flex items-center justify-between">
                    <span>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString(
                            undefined,
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "No deadline"}
                    </span>
                    <Clock className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Assignee
                  </span>
                </div>
                {task.assignees.length > 0 ? (
                  <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#2eb781] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {task.assignees[0][0].toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {task.assignees[0]}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic px-1">
                    No assignee assigned.
                  </p>
                )}
              </div>

              {/* Collaborators */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Collaborators
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {loadingCollaborators ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  ) : collaborators.length > 0 ? (
                    <div className="space-y-2">
                      {collaborators.map((c, i) => (
                        <div
                          key={c.id}
                          className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div
                            className={`w-8 h-8 rounded-xl ${
                              avatarColors[i % avatarColors.length].bg
                            } ${
                              avatarColors[i % avatarColors.length].text
                            } flex items-center justify-center text-xs font-bold shrink-0`}
                          >
                            {(c.full_name || "?")[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700 truncate flex-1">
                            {c.full_name}
                          </span>
                          {canEditTaskDetails && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCollaborator(task.id, c.staff_id)
                              }
                              className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic px-1 pb-2">
                      No collaborators.
                    </p>
                  )}

                  {!canEditTaskDetails ? (
                    <div className="flex items-center gap-2 pt-2 opacity-50 grayscale-[0.5] cursor-not-allowed">
                      <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none">
                        Read Only
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedCollaboratorId}
                          onChange={(e) =>
                            setSelectedCollaboratorId(e.target.value)
                          }
                          className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            Add member...
                          </option>
                          {availableStaff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCollaborator(task.id)}
                        disabled={
                          !selectedCollaboratorId || isAddingCollaborator
                        }
                        className="p-2.5 rounded-xl bg-[#2eb781] text-white hover:bg-[#279e6f] transition-colors disabled:opacity-50"
                      >
                        {isAddingCollaborator ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* <div className="p-6 bg-emerald-50/30 rounded-[32px] border border-emerald-50 text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-1">
              Synchronized
            </p>
            <p className="text-[10px] text-emerald-500/80 font-medium leading-relaxed">
              All changes are saved automatically to the cloud.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
