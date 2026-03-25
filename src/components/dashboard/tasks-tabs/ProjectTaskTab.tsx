"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Plus,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Paperclip,
    ChevronRight,
    Search,
    Filter,
    Calendar,
    Check,
    UserCircle2,
    Loader2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// types to match our SQL schema
type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    assignees: string[]; // Names for display
    assignee_ids: string[]; // User IDs for logic
    attachments_count: number;
    comments_count: number;
}

interface ProjectTaskTabProps {
    projectId: string;
}

const COLUMNS = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100', dot: 'bg-gray-400' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { id: 'done', title: 'Done', color: 'bg-purple-50', dot: 'bg-purple-500' }
];

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

const ProjectTaskTab = ({ projectId }: ProjectTaskTabProps) => {
    const supabase = React.useMemo(() => createClient(), []);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
    });

    const fetchInitialData = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            // 1. Fetch Project Staff (joined with staffs table to get names)
            const { data: staffData, error: staffError } = await supabase
                .from('project_staff')
                .select(`
                    staff_id,
                    staffs:staff_id (
                        id,
                        full_name,
                        user_id
                    )
                `)
                .eq('project_id', projectId);

            if (staffError) throw staffError;
            setStaff(staffData?.map((s: any) => s.staffs) || []);

            // 2. Fetch Tasks with Assignees (simplified fetch to avoid join issues)
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    task_assignees (
                        user_id
                    )
                `)
                .eq('project_id', projectId);

            if (tasksError) throw tasksError;

            const currentStaff = staffData?.map((s: any) => s.staffs) || [];
            const formattedTasks: Task[] = (tasksData || []).map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status as TaskStatus,
                priority: task.priority as TaskPriority,
                due_date: task.due_date,
                assignees: task.task_assignees?.map((a: any) =>
                    currentStaff.find((s: any) => s.user_id === a.user_id)?.full_name || 'Unknown'
                ) || [],
                assignee_ids: task.task_assignees?.map((a: any) => a.user_id) || [],
                attachments_count: 0,
                comments_count: 0,
            }));

            setTasks(formattedTasks);
        } catch (error: any) {
            console.error('Error fetching task data:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        } finally {
            setLoading(false);
        }
    }, [projectId, supabase]);

    useEffect(() => {
        fetchInitialData();
    }, [projectId]); // Depend only on projectId to avoid re-fetch loops

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const taskToUpdate = tasks.find(t => t.id === draggableId);
        if (!taskToUpdate) return;

        const newStatus = destination.droppableId as TaskStatus;
        const oldTasks = [...tasks];

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === draggableId ? { ...t, status: newStatus } : t
        ));

        // Supabase update
        const { data, error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', draggableId)
            .select();
        if (error) {
            console.error('Error updating task status:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            setTasks(oldTasks); // Rollback
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        const oldTasks = [...tasks];

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));

        // Supabase update
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (error) {
            console.error('Error updating task status:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            setTasks(oldTasks); // Rollback
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title) return;

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw authError || new Error('User not found');

            // Fetch company_id for the project
            const { data: projectData, error: projectFetchError } = await supabase
                .from('projects')
                .select('company_id')
                .eq('id', projectId)
                .single();

            if (projectFetchError || !projectData) throw projectFetchError || new Error('Project not found');

            // 1. Create Task
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    project_id: projectId,
                    company_id: projectData.company_id,
                    title: newTask.title,
                    description: newTask.description || '',
                    priority: newTask.priority || 'medium',
                    status: (newTask.status as TaskStatus) || 'todo',
                    due_date: newTask.due_date || null,
                    created_by: user.id
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // 2. Create Assignees using user_ids from staffs table
            if (selectedAssignees.length > 0) {
                const assigneesToInsert = selectedAssignees.map(userId => ({
                    task_id: taskData.id,
                    user_id: userId
                }));

                const { error: assignError } = await supabase
                    .from('task_assignees')
                    .insert(assigneesToInsert);

                if (assignError) throw assignError;
            }

            // Refresh UI
            fetchInitialData();
            setIsModalOpen(false);
            setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
            setSelectedAssignees([]);
        } catch (error: any) {
            console.error('Error creating task:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        }
    };

    const toggleAssignee = (userId: string) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (loading) {
        return (
            <div className="flex h-[600px] items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#2eb781] animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Loading project tasks...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-500 relative">
            {/* Kanban Header / Controls */}
            <div className="p-4 border-b border-gray-50 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all w-64 text-gray-700"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700 font-bold">
                    <div className="flex -space-x-2 mr-4">
                        {staff.slice(0, 5).map((s, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 ring-1 ring-gray-100" title={s.full_name}>
                                {getInitials(s.full_name)}
                            </div>
                        ))}
                        {staff.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                +{staff.length - 5}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setNewTask({ ...newTask, status: 'todo' });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-lg text-sm font-bold hover:bg-[#259b6d] transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 p-6 h-full overflow-x-auto min-h-[600px] bg-gray-50/50">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="flex-1 min-w-[320px] flex flex-col group">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${column.dot}`} />
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        {column.title}
                                        <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                            {tasks.filter(t => t.status === column.id).length}
                                        </span>
                                    </h3>
                                </div>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 flex flex-col gap-4 rounded-xl transition-all p-2 ${snapshot.isDraggingOver ? 'bg-[#2eb781]/5 ring-2 ring-[#2eb781]/20 ring-inset' : ''
                                            }`}
                                    >
                                        {tasks
                                            .filter((task) => task.status === column.id)
                                            .map((task, index) => (
                                                <Draggable
                                                    key={String(task.id)}
                                                    draggableId={String(task.id)}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2eb781]/30 transition-all select-none group/card ${snapshot.isDragging ? 'shadow-xl scale-105 border-[#2eb781] ring-4 ring-[#2eb781]/10 z-50' : ''
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2 relative">
                                                                <PriorityBadge priority={task.priority} />
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                    {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                                                        <button
                                                                            key={c.id}
                                                                            title={`Move to ${c.title}`}
                                                                            onClick={() => updateTaskStatus(task.id, c.id as TaskStatus)}
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
                                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                                                                {task.description}
                                                            </p>

                                                            {/* Card Footer */}
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <div className="flex items-center gap-3">
                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex -space-x-1.5">
                                                                    {task.assignees.map((name, i) => (
                                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600" title={name}>
                                                                            {getInitials(name)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}

                                        <button
                                            onClick={() => {
                                                setNewTask({ ...newTask, status: column.id as TaskStatus });
                                                setIsModalOpen(true);
                                            }}
                                            className="py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium hover:border-[#2eb781] hover:text-[#2eb781] hover:bg-white transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-gray-50/50 mt-2"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Task
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Create Task Modal with Assignees */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4 font-sans">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Create New Project Task</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="p-6 space-y-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-gray-900"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                    <textarea
                                        placeholder="Add more context or sub-tasks..."
                                        value={newTask.description}
                                        rows={3}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all resize-none text-gray-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all cursor-pointer text-gray-900"
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</label>
                                        <input
                                            type="date"
                                            value={newTask.due_date || ''}
                                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all cursor-pointer text-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Assignees Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign To Project Members</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {staff.length === 0 ? (
                                            <p className="text-xs text-gray-400 col-span-2 py-2 italic">No members found in this project.</p>
                                        ) : (
                                            staff.map((member) => (
                                                <button
                                                    key={member.user_id}
                                                    type="button"
                                                    onClick={() => toggleAssignee(member.user_id)}
                                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${selectedAssignees.includes(member.user_id)
                                                        ? 'bg-[#2eb781]/5 border-[#2eb781] text-[#2eb781]'
                                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${selectedAssignees.includes(member.user_id) ? 'bg-[#2eb781] text-white' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {getInitials(member.full_name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate">{member.full_name}</p>
                                                    </div>
                                                    {selectedAssignees.includes(member.user_id) && (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTask.title}
                                    className="px-8 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-bold hover:bg-[#259b6d] transition-all shadow-lg shadow-[#2eb781]/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectTaskTab;