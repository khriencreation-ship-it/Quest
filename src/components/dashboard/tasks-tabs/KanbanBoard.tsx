"use client";

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../../types/kanban-types';
import { KanbanColumn } from './KanbanColumn';
import { SortableTaskCard } from './SortableTaskCard';

interface KanbanBoardProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    updateTaskStatusAsync: (taskId: string, newStatus: TaskStatus) => Promise<void>;
    onAddTask: (status: TaskStatus) => void;
}

const COLUMNS = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100', dot: 'bg-gray-400' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { id: 'done', title: 'Done', color: 'bg-purple-50', dot: 'bg-purple-500' }
];

export const KanbanBoard = ({ tasks, setTasks, updateTaskStatusAsync, onAddTask }: KanbanBoardProps) => {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // Provide local state specifically for the UI to be highly responsive and avoid snap-backs
    // The parent task array is source of truth, but while dragging we manipulate this.
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

    // Sync from parent if dragging is not occurring
    useEffect(() => {
        if (!activeTask) {
            setLocalTasks(tasks);
        }
    }, [tasks, activeTask]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires 5px movement before drag starts (prevents accidental drags on click)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Optimistic status update handler for buttons (Chevron clicks)
    const handleStatusMenuClick = (taskId: string, newStatus: TaskStatus) => {
        // Optimistic UI
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        // Async DB 
        updateTaskStatusAsync(taskId, newStatus).catch(console.error);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = localTasks.find(t => t.id === active.id);
        if (task) {
            setActiveTask(task);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveTask) return;

        setLocalTasks((prev) => {
            const activeIndex = prev.findIndex(t => t.id === activeId);

            if (activeIndex === -1) return prev;

            if (isOverTask) {
                const overIndex = prev.findIndex(t => t.id === overId);
                if (overIndex === -1) return prev;

                if (prev[activeIndex].status !== prev[overIndex].status) {
                    const newTasks = [...prev];
                    newTasks[activeIndex] = { ...newTasks[activeIndex], status: prev[overIndex].status as TaskStatus };
                    return arrayMove(newTasks, activeIndex, overIndex);
                }

                return arrayMove(prev, activeIndex, overIndex);
            }

            if (isOverColumn) {
                const newTasks = [...prev];
                newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId as TaskStatus };
                return arrayMove(newTasks, activeIndex, activeIndex);
            }

            return prev;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveTask(null);
            return;
        }

        const activeId = String(active.id);
        const activeTaskCache = localTasks.find(t => t.id === activeId);

        if (!activeTaskCache) {
            setActiveTask(null);
            return;
        }

        // Parent state needs to track the final position of things
        setTasks(localTasks);
        setActiveTask(null);

        // Check original state vs new state to see if status actually changed for DB sync
        const originalTask = tasks.find(t => t.id === activeId);
        if (originalTask && originalTask.status !== activeTaskCache.status) {
            updateTaskStatusAsync(activeId, activeTaskCache.status).catch(console.error);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 p-6 h-[calc(100vh-280px)] min-h-[500px] overflow-x-auto custom-scrollbar">
                {COLUMNS.map(column => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        allColumns={COLUMNS}
                        tasks={localTasks.filter(t => t.status === column.id)}
                        updateTaskStatus={handleStatusMenuClick}
                        onAddTask={onAddTask}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <SortableTaskCard
                        task={activeTask}
                        updateTaskStatus={handleStatusMenuClick}
                        columns={COLUMNS}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
