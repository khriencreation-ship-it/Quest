"use client";

import React, { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, MoreHorizontal, CheckSquare } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../../../types/kanban-types";

interface SortableTaskCardProps {
  task: Task;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  columns: { id: string; title: string; color: string; dot: string }[];
  onOpenDetails: (task: Task) => void;
  disableDrag?: boolean;
  isManager?: boolean;
}

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const styles = {
    low: "bg-gray-100 text-gray-600 border-gray-200",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    high: "bg-rose-100 text-rose-700 border-rose-200 ring-1 ring-rose-500/20",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles[priority]}`}
    >
      {priority}
    </span>
  );
};

const getInitials = (name: string) => {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "??"
  );
};

const UserAvatar = ({
  name,
  size = "sm",
  className = "",
}: {
  name: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) => {
  const initials = getInitials(name);

  const colors = [
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-rose-400 to-red-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-blue-500",
    "from-indigo-400 to-purple-500",
  ];

  const charCodeSum = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = charCodeSum % colors.length;
  const gradient = colors[colorIndex];

  const sizeMap = {
    xs: "w-5 h-5 text-[7px]",
    sm: "w-6 h-6 text-[9px]",
    md: "w-8 h-8 text-[11px]",
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-linear-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white shrink-0 ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export const SortableTaskCard = ({
  task,
  updateTaskStatus,
  columns,
  onOpenDetails,
  disableDrag = false,
  isManager = false,
}: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
    disabled: disableDrag,
  });

  // Track pointer movement to distinguish clicks from drags
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white p-4 rounded-xl border-2 border-[#2eb781] shadow-xl opacity-50 z-50 relative"
      >
        <div className="flex justify-between items-start mb-2">
          <PriorityBadge priority={task.priority} />
        </div>
        <h4 className="font-bold text-gray-900 leading-snug mb-2">
          {task.title}
        </h4>
      </div>
    );
  }

  const hasSubtasks = task.total_subtasks && task.total_subtasks > 0;

  // Overdue logic
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "done";

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if the pointer barely moved (genuine click, not a drag)
    if (pointerStartPos.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x);
      const dy = Math.abs(e.clientY - pointerStartPos.current.y);
      if (dx < 5 && dy < 5) {
        onOpenDetails(task);
      }
    }
    pointerStartPos.current = null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(disableDrag ? {} : listeners)}
      onPointerDown={(e) => {
        handlePointerDown(e);
        if (!disableDrag && listeners?.onPointerDown) {
          listeners.onPointerDown(e);
        }
      }}
      onClick={handleClick}
      className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2eb781]/30 transition-all select-none group/card cursor-pointer ${disableDrag ? "opacity-90" : "active:cursor-grabbing"}`}
    >
      <div className="flex justify-between items-start mb-3 relative">
        <div className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.is_project_task && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100 bg-purple-50 text-purple-700 uppercase tracking-wide">
              Project
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenDetails(task);
          }}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover/card:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className="font-bold text-gray-900 leading-snug mb-2 group-hover/card:text-[#2eb781] transition-colors break-words">
        {task.title}
      </h4>

      {task.is_project_task && task.project_name && (
        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-purple-600/70">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          {task.project_name}
        </div>
      )}

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed italic">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div
              className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? "text-rose-600" : "text-gray-400"}`}
            >
              <Clock
                className={`w-3 h-3 ${isOverdue ? "animate-pulse" : ""}`}
              />
              <span>
                {new Date(task.due_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {hasSubtasks && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2eb781] bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <CheckSquare className="w-3 h-3" />
              <span>
                {task.completed_subtasks || 0}/{task.total_subtasks}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Assignee Avatar - shown for all users */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-2">
              <UserAvatar name={task.assignees[0]} size="sm" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter max-w-[40px] truncate">
                {task.assignees[0].split(" ")[0]}
              </span>
            </div>
          )}

          {/* Collaborator Dots */}
          {task.collaborator_names && task.collaborator_names.length > 0 && (
            <div
              className={`flex -space-x-2.5 ${task.assignees && task.assignees.length > 0 ? "pl-2 border-l border-gray-100" : ""}`}
            >
              {task.collaborator_names.slice(0, 3).map((name, i) => (
                <UserAvatar key={i} name={name} size="xs" className="z-[10]" />
              ))}
              {task.collaborator_names.length > 3 && (
                <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[7px] font-bold text-gray-500 shrink-0 z-[11] shadow-sm">
                  +{task.collaborator_names.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
