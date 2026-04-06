'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    Loader2,
    Clock,
    Type,
    AlignLeft,
    BarChart2,
    AlertCircle,
    User
} from 'lucide-react';
import { Task, SubTask, TaskStatus, TaskPriority } from '@/types/kanban-types';
import {
    getSubTasks,
    createSubTask,
    toggleSubTask,
    deleteSubTask,
    updateTaskPriority,
    updateTaskStatus
} from '@/app/actions/tasks';

interface TaskDetailsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onUpdateTask: (task: Task) => void;
}

export default function TaskDetailsSidebar({
    isOpen,
    onClose,
    task,
    onUpdateTask
}: TaskDetailsSidebarProps) {
    const [subTasks, setSubTasks] = useState<SubTask[]>([]);
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
    const [loadingSubTasks, setLoadingSubTasks] = useState(false);
    const [isAddingSubTask, setIsAddingSubTask] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingPriority, setUpdatingPriority] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (task && isOpen) {
            setError(null);
            fetchSubTasks();
        } else {
            setSubTasks([]);
            setError(null);
        }
    }, [task, isOpen]);

    const fetchSubTasks = async () => {
        if (!task) return;
        setLoadingSubTasks(true);
        const { data, error: fetchError } = await getSubTasks(task.id);
        if (fetchError) {
            setError(fetchError);
        } else if (data) {
            setSubTasks(data as SubTask[]);
        }
        setLoadingSubTasks(false);
    };

    const handleAddSubTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || !newSubTaskTitle.trim()) return;

        setError(null);
        setIsAddingSubTask(true);
        const result = await createSubTask(task.id, newSubTaskTitle.trim());
        if (result.success && result.data) {
            const newSub = result.data as SubTask;
            const updatedSubTasks = [...subTasks, newSub];
            setSubTasks(updatedSubTasks);
            setNewSubTaskTitle('');

            onUpdateTask({
                ...task,
                sub_tasks: updatedSubTasks,
                total_subtasks: updatedSubTasks.length,
                completed_subtasks: updatedSubTasks.filter(s => s.completed).length
            });
        } else if (result.error) {
            setError(result.error);
        }
        setIsAddingSubTask(false);
    };

    const handleToggleSubTask = async (subTaskId: string, completed: boolean) => {
        if (!task) return;

        // Optimistic update
        const updatedSubTasks = subTasks.map(st =>
            st.id === subTaskId ? { ...st, completed } : st
        );
        setSubTasks(updatedSubTasks);

        const result = await toggleSubTask(subTaskId, completed);
        if (!result.success) {
            // Rollback on error
            fetchSubTasks();
        } else {
            onUpdateTask({
                ...task,
                sub_tasks: updatedSubTasks,
                completed_subtasks: updatedSubTasks.filter(s => s.completed).length
            });
        }
    };

    const handleDeleteSubTask = async (subTaskId: string) => {
        if (!task) return;

        const updatedSubTasks = subTasks.filter(st => st.id !== subTaskId);
        setSubTasks(updatedSubTasks);

        const result = await deleteSubTask(subTaskId);
        if (!result.success) {
            fetchSubTasks();
        } else {
            onUpdateTask({
                ...task,
                sub_tasks: updatedSubTasks,
                total_subtasks: updatedSubTasks.length,
                completed_subtasks: updatedSubTasks.filter(s => s.completed).length
            });
        }
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        if (!task) return;
        setUpdatingStatus(true);
        const result = await updateTaskStatus(task.id, newStatus);
        if (!result.error) {
            const updatedTask = { ...task, status: newStatus };
            onUpdateTask(updatedTask);
        }
        setUpdatingStatus(false);
    };

    const handlePriorityChange = async (newPriority: TaskPriority) => {
        if (!task) return;
        setUpdatingPriority(true);
        const result = await updateTaskPriority(task.id, newPriority);
        if (result.success) {
            const updatedTask = { ...task, priority: newPriority };
            onUpdateTask(updatedTask);
        }
        setUpdatingPriority(false);
    };

    if (!task) return null;

    const progressPercentage = subTasks.length > 0
        ? Math.round((subTasks.filter(st => st.completed).length / subTasks.length) * 100)
        : 0;

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/40 backdrop-blur-md z-60 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Modal Container */}
            <div 
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] z-70 flex flex-col rounded-[32px] overflow-hidden transform transition-all duration-300 ease-out fill-mode-forwards ${
                    isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
                }`}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
                            {task.title.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-0.5">Task Detail View</span>
                            <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{task.title}</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all active:scale-90"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                        {/* Main Content (Left) */}
                        <div className="lg:col-span-8 overflow-y-auto no-scrollbar p-8 border-r border-gray-50 bg-white">
                            <div className="space-y-10">
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-rose-700">Database Issue</p>
                                            <p className="text-xs text-rose-600 leading-relaxed">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <AlignLeft className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</span>
                                    </div>
                                    <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[24px] text-[15px] text-gray-600 leading-relaxed min-h-[120px] transition-colors hover:bg-gray-50">
                                        {task.description || <span className="italic text-gray-300">No description provided. Click to add...</span>}
                                    </div>
                                </div>

                                {/* Sub-tasks Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Checklist</span>
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

                                    <div className="space-y-2.5">
                                        {loadingSubTasks ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                            </div>
                                        ) : subTasks.length === 0 ? (
                                            <div className="group py-12 px-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-3 transition-colors hover:border-emerald-100 hover:bg-emerald-50/20">
                                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                                                    <Plus className="w-6 h-6 text-gray-300 group-hover:text-emerald-500" />
                                                </div>
                                                <p className="text-sm text-gray-400 font-medium tracking-tight">Add your first sub-task below</p>
                                            </div>
                                        ) : (
                                            subTasks.map(st => (
                                                <div 
                                                    key={st.id} 
                                                    className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <button 
                                                            onClick={() => handleToggleSubTask(st.id, !st.completed)}
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
                                                        <span className={`text-[15px] font-medium transition-all ${
                                                            st.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                                                        }`}>
                                                            {st.title}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteSubTask(st.id)}
                                                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <form onSubmit={handleAddSubTask} className="relative group pt-2">
                                        <input 
                                            type="text"
                                            placeholder="Add a new sub-task..."
                                            value={newSubTaskTitle}
                                            onChange={(e) => setNewSubTaskTitle(e.target.value)}
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
                            </div>
                        </div>

                        {/* Sidebar Column (Right) */}
                        <div className="lg:col-span-4 bg-gray-50/30 p-8 space-y-10 border-l border-gray-50 overflow-y-auto no-scrollbar">
                            {/* Status */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <BarChart2 className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
                                </div>
                                <div className="relative group">
                                    <select 
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
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

                            {/* Priority */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Priority</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => handlePriorityChange(p)}
                                            disabled={updatingPriority}
                                            className={`py-2 rounded-xl text-[11px] font-bold uppercase tracking-tighter transition-all border-2 ${
                                                task.priority === p 
                                                    ? p === 'high' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm shadow-rose-100' :
                                                      p === 'medium' ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm shadow-amber-100' :
                                                      'bg-sky-50 border-sky-500 text-sky-600 shadow-sm shadow-sky-100'
                                                    : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="space-y-8 pt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Due Date</span>
                                    </div>
                                    <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <span className="text-sm font-bold text-gray-700">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { 
                                                month: 'short', day: 'numeric', year: 'numeric' 
                                            }) : 'No deadline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <User className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Assignees</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {task.assignees.map((name, i) => (
                                            <div 
                                                key={i} 
                                                className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl flex items-center gap-2 shadow-sm"
                                            >
                                                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">
                                                    {name[0].toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Loader2 className={`w-3 h-3 text-emerald-500 ${isAddingSubTask || loadingSubTasks ? 'animate-spin' : ''}`} />
                        Cloud Synchronized: Quest Workspace
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase">Live</span>
                    </div>
                </div>
            </div>
        </>
    );
}
