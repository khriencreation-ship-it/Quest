"use client";

import React, { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  CheckSquare,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../../../types/kanban-types";

interface SortableTaskCardProps {
  task: Task;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  columns: { id: string; title: string; color: string; dot: string }[];
  onOpenDetails: (task: Task) => void;
  disableDrag?: boolean;
}

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const styles = {
    low: "bg-gray-100 text-gray-600 border-gray-200",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    high: "bg-rose-50 text-rose-700 border-rose-100",
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

export const SortableTaskCard = ({
  task,
  updateTaskStatus,
  columns,
  onOpenDetails,
  disableDrag = false,
}: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task }, disabled: disableDrag });

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

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if the pointer barely moved (genuine click, not a drag)
    if (pointerStartPos.current) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // If transform was applied during drag, the click fires after drop —
      // we still want to suppress it. Check distance from start pos.
      // pointerStartPos is set on pointerDown and cleared here.
      // If the card was dragged at all, don't navigate.
    }
    // The click event fires AFTER pointerUp, and only if the browser
    // considers it a click (no drag cancellation). However, dnd-kit's
    // PointerSensor prevents the click event when a drag occurs (distance > 5px).
    // So if we get here, it IS a genuine click.
    onOpenDetails(task);
    pointerStartPos.current = null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(disableDrag ? {} : { ...attributes, ...listeners })}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2eb781]/30 transition-all select-none group/card cursor-pointer ${disableDrag ? "opacity-90" : "active:cursor-grabbing"}`}
    >
      <div className="flex justify-between items-start mb-2 relative">
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

      <h4 className="font-bold text-gray-900 leading-snug mb-1 group-hover/card:text-[#2eb781] transition-colors">
        {task.title}
      </h4>

      {task.is_project_task && task.project_name && (
        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-purple-600/70">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          {task.project_name}
        </div>
      )}

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <Clock className="w-3 h-3" />
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

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 ring-1 ring-gray-100 shrink-0"
            >
              {getInitials(task.assignees[0])}
            </div>
            <span className="text-[10px] font-medium text-gray-500 truncate max-w-[72px]">
              {task.assignees[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
