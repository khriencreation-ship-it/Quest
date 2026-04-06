"use client";

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../../types/kanban-types';
import { SortableTaskCard } from './SortableTaskCard';

interface KanbanColumnProps {
    column: { id: string; title: string; color: string; dot: string };
    tasks: Task[];
    allColumns: { id: string; title: string; color: string; dot: string }[];
    updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
    onAddTask: (status: TaskStatus) => void;
    onOpenDetails: (task: Task) => void;
}

export const KanbanColumn = ({ column, tasks, allColumns, updateTaskStatus, onAddTask, onOpenDetails }: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    });

    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    return (
        <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden flex-1 min-w-[320px]">
            {/* Column Header */}
            <div className={`px-4 py-3 border-b border-gray-100 bg-white/50 flex flex-col gap-1 transition-colors ${isOver ? column.color : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${column.dot}`} />
                        <h3 className="font-bold text-gray-900 text-sm tracking-wide">{column.title}</h3>
                        <span className="bg-white text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-gray-100">
                            {tasks.length}
                        </span>
                    </div>
                    <button
                        onClick={() => onAddTask(column.id as TaskStatus)}
                        className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"
                        title="Add Task"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar transition-colors duration-200 ${isOver ? column.color : ''}`}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            updateTaskStatus={updateTaskStatus}
                            columns={allColumns}
                            onOpenDetails={onOpenDetails}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-xs font-medium text-gray-400">Drop tasks here</p>
                    </div>
                )}
            </div>

            {/* Quick Add Button */}
            <div className="p-3 bg-white/50 border-t border-gray-100">
                <button
                    onClick={() => onAddTask(column.id as TaskStatus)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                    <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2eb781] transition-colors" />
                    Add Task
                </button>
            </div>
        </div>
    );
};
