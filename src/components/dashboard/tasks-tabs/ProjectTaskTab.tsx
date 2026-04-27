"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { KanbanBoard } from './KanbanBoard';
import TaskDetailsSidebar from './TaskDetailsSidebar';
import { Task, TaskStatus, TaskPriority } from '../../../types/kanban-types';
import { updateTaskStatus, createProjectTask } from '@/app/actions/tasks';
import CreateTaskModal from '../modals/CreateTaskModal';
import { toast } from 'sonner';

interface ProjectTaskTabProps {
    projectId: string;
}
const supabase = createClient();

const ProjectTaskTab = ({ projectId }: ProjectTaskTabProps) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [filterMember, setFilterMember] = useState<string>('all');
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
    });
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

            // 2. Fetch Tasks with Assignees and Sub-tasks
            let { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    task_assignees (
                        user_id
                    ),
                    task_subtasks (
                        id,
                        title,
                        completed
                    )
                `)
                .eq('project_id', projectId);

            // If it fails (possibly because task_subtasks doesn't exist yet)
            if (tasksError) {

                // Fallback: Fetch tasks without sub-tasks join
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('tasks')
                    .select(`
                        *,
                        task_assignees (
                            user_id
                        )
                    `)
                    .eq('project_id', projectId);

                if (fallbackError) throw fallbackError;
                tasksData = fallbackData;
            }

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
                sub_tasks: task.task_subtasks || [],
                total_subtasks: task.task_subtasks?.length || 0,
                completed_subtasks: task.task_subtasks?.filter((st: any) => st.completed).length || 0,
            }));

            setTasks(formattedTasks);
        } catch (error: any) {
            console.error('Error fetching task data:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchInitialData();
    }, [projectId]); // Depend only on projectId to avoid re-fetch loops

    const updateTaskStatusAsync = async (taskId: string, newStatus: TaskStatus) => {
        const oldTasks = [...tasks];

        // Optimistic update
        setTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, status: newStatus } : task
            )
        );

        try {
            const result = await updateTaskStatus(taskId, newStatus);

            if (result.error) {
                throw new Error(result.error);
            }
        } catch (err: any) {
            console.error('Update failed:', err?.message || err);
            // Rollback on failure
            setTasks(oldTasks);
        }
    };

    const handleOpenDetails = (task: Task) => {
        setSelectedTask(task);
        setIsSidebarOpen(true);
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title) return;

        try {
            // Fetch company_id for the project
            const { data: projectData, error: projectFetchError } = await supabase
                .from('projects')
                .select('company_id')
                .eq('id', projectId)
                .single();

            if (projectFetchError || !projectData) throw projectFetchError || new Error('Project not found');

            const taskInput = {
                project_id: projectId,
                company_id: projectData.company_id,
                title: newTask.title,
                description: newTask.description || '',
                priority: newTask.priority || 'medium',
                status: (newTask.status as TaskStatus) || 'todo',
                due_date: newTask.due_date || null,
            };

            const result = await createProjectTask(taskInput, selectedAssignee);

            if (result.error) throw new Error(result.error);

            // Refresh UI
            fetchInitialData();
            setIsModalOpen(false);
            toast.success('Task created successfully');
            setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
            setSelectedAssignee('');
        } catch (error: any) {
            console.error('Error creating task:', error);
            toast.error(error.message || 'Failed to create task');
        }
    };

    const toggleAssignee = (userId: string) => {
        setSelectedAssignee(userId);
    };

    const handleSetTasks = (newTasks: React.SetStateAction<Task[]>) => {
        if (filterMember === 'all') {
            setTasks(newTasks);
        } else {
            setTasks(prev => {
                const updatedSubset = typeof newTasks === 'function' ? newTasks(prev.filter(t => t.assignee_ids?.includes(filterMember))) : newTasks;
                const updatedMap = new Map((updatedSubset || []).map(t => [t.id, t]));
                return prev.map(t => updatedMap.get(t.id) || t);
            });
        }
    };

    const filteredTasks = tasks.filter(t => filterMember === 'all' || t.assignee_ids?.includes(filterMember));

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
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Staff Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full sm:max-w-[70%] py-1">
                    <button
                        onClick={() => setFilterMember('all')}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${filterMember === 'all'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100 ring-1 ring-emerald-600'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                    >
                        All Tasks
                    </button>
                    <div className="h-4 w-[1px] bg-gray-200 mx-1 flex-shrink-0" />
                    {staff.map((s) => (
                        <button
                            key={s.user_id}
                            onClick={() => setFilterMember(s.user_id)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${filterMember === s.user_id
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100 ring-1 ring-emerald-600'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                        >
                            {s.full_name?.split(' ')[0] || 'Staff'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 text-gray-700 font-bold shrink-0">
                    <div className="flex -space-x-4 mr-2">
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
                    {filterMember !== 'all' && (
                        <button
                            onClick={() => {
                                setNewTask({ ...newTask, status: 'todo' });
                                setSelectedAssignee(filterMember);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-lg text-sm font-bold hover:bg-[#259b6d] transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="">New Task</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
                tasks={filteredTasks}
                setTasks={handleSetTasks}
                updateTaskStatusAsync={updateTaskStatusAsync}
                onOpenDetails={handleOpenDetails}
                canAddTask={filterMember !== 'all'}
                onAddTask={(status) => {
                    if (filterMember !== 'all') {
                        setSelectedAssignee(filterMember);
                    }
                    setNewTask({ ...newTask, status });
                    setIsModalOpen(true);
                }}
            />

            {/* Create Task Modal with Assignees */}
            {isModalOpen && (
                <CreateTaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreateTask}
                    staff={staff}
                    selectedAssignee={selectedAssignee}
                    toggleAssignee={toggleAssignee}
                    newTask={newTask}
                    getInitials={getInitials}
                    setNewTask={setNewTask}
                />
            )}
            {/* Task Details Sidebar */}
            <TaskDetailsSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                task={selectedTask}
                onUpdateTask={handleUpdateTask}
            />
        </div>
    );
};

export default ProjectTaskTab;