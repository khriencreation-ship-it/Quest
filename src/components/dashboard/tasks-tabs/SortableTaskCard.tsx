"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MessageSquare, Paperclip, ChevronRight } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../../types/kanban-types';

interface SortableTaskCardProps {
    task: Task;
    updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
    columns: { id: string; title: string; color: string; dot: string }[];
}

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
    const styles = {
        low: 'bg-gray-100 text-gray-600 border-gray-200',
        medium: 'bg-amber-50 text-amber-700 border-amber-100',
        high: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles[priority]}`}>
            {priority}
        </span>
    );
};

const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
};

export const SortableTaskCard = ({ task, updateTaskStatus, columns }: SortableTaskCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white p-4 rounded-xl border-2 border-[#2eb781] shadow-xl opacity-50 scale-105 z-50 relative"
            >
                <div className="flex justify-between items-start mb-2">
                    <PriorityBadge priority={task.priority} />
                </div>
                <h4 className="font-bold text-gray-900 leading-snug mb-2">{task.title}</h4>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2eb781]/30 transition-all select-none group/card cursor-grab active:cursor-grabbing"
        >
            <div className="flex justify-between items-start mb-2 relative">
                <PriorityBadge priority={task.priority} />
                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                    {columns.filter(c => c.id !== task.status).map(c => (
                        <button
                            key={c.id}
                            title={`Move to ${c.title}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateTaskStatus(task.id, c.id as TaskStatus);
                            }}
                            className={`p-1 rounded hover:bg-gray-100 transition-colors ${c.dot.replace('bg-', 'text-')}`}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ))}
                </div>
            </div>
            <h4 className="font-bold text-gray-900 leading-snug mb-2 group-hover/card:text-[#2eb781] transition-colors">
                {task.title}
            </h4>
            {task.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-3 text-gray-400">
                    {task.due_date && (
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}
                    {(task.comments_count > 0 || task.attachments_count > 0) && (
                        <div className="flex items-center gap-2">
                            {task.comments_count > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{task.comments_count}</span>
                                </div>
                            )}
                            {task.attachments_count > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{task.attachments_count}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-1.5">
                        {task.assignees.slice(0, 3).map((assignee, i) => (
                            <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 ring-1 ring-gray-100"
                                title={assignee}
                            >
                                {getInitials(assignee)}
                            </div>
                        ))}
                        {task.assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-bold text-gray-400 ring-1 ring-gray-100">
                                +{task.assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
