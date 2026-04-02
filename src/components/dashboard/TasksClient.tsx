'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Building2, Calendar, Paperclip, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import CreateOrgTaskModal from './CreateOrgTaskModal';
import { KanbanBoard } from '@/components/dashboard/tasks-tabs/KanbanBoard';
import { Task, TaskStatus } from '@/types/kanban-types';
import { updateOrgTaskStatus } from '@/app/actions/org_tasks';

type StaffRelation = { staffs: { full_name: string, id: string } } | null;
type AttachmentRelation = { id: string }[];

export type OrgTask = {
    id: string;
    organization_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: 'todo' | 'in_progress' | 'done';
    created_at: string;
    created_by: string | null;
    org_task_assignees?: StaffRelation[];
    org_task_attachments?: AttachmentRelation;
};

type RelationItem = {
    id: string;
    name: string;
};

export default function TasksClient({
    initialTasks,
    organizations
}: {
    initialTasks: OrgTask[],
    organizations: RelationItem[]
}) {
    const searchParams = useSearchParams();
    const activeOrgId = searchParams.get('org');
    const isCompanyLevel = !activeOrgId;

    const [search, setSearch] = useState('');

    // Map initial OrgTasks to Kanban Task type
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        setTasks(
            initialTasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description || '',
                status: t.status as TaskStatus,
                priority: 'medium', // Org tasks don't use priority currently, map to medium
                due_date: t.due_date || '',
                assignees: t.org_task_assignees?.map(a => a?.staffs?.full_name).filter(Boolean) as string[] || [],
                assignee_ids: t.org_task_assignees?.map(a => a?.staffs?.id).filter(Boolean) as string[] || [],
                attachments_count: t.org_task_attachments?.length || 0,
                comments_count: 0,
                organization_id: t.organization_id // attach for filtering
            } as Task & { organization_id: string }))
        );
    }, [initialTasks]);

    const activeOrgName = organizations.find(o => o.id === activeOrgId)?.name;

    // Filter tasks based on Org and Search
    const filteredTasks = tasks.filter((t: any) => {
        if (!isCompanyLevel && t.organization_id !== activeOrgId) return false;
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const updateTaskStatusAsync = async (taskId: string, newStatus: TaskStatus) => {
        const result = await updateOrgTaskStatus(taskId, newStatus);
        if (result.error) {
            throw new Error(result.error);
        }
    };

    // Modal Control State for <CreateOrgTaskModal> bypass trigger
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [initialModalStatus, setInitialModalStatus] = useState<TaskStatus>('todo');

    // 1. Initial State: No organization selected
    if (isCompanyLevel) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                    <Building2 className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select an Organization</h2>
                <p className="text-gray-500 max-w-sm mb-8">
                    To view and manage internal tasks, please select an organization from the left sidebar switcher.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                    {organizations.map(org => (
                        <Link
                            key={org.id}
                            href={`/dashboard/tasks?org=${org.id}`}
                            className="p-4 bg-white border border-gray-200 rounded-2xl hover:border-[#2eb781] hover:bg-emerald-50/30 transition-all text-left group"
                        >
                            <p className="font-bold text-gray-900 group-hover:text-[#2eb781]">{org.name}</p>
                            <p className="text-xs text-gray-500 mt-1">View Workspace Tasks</p>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-500 relative">

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-50 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mr-2">
                        {/* <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5" />
                        </div> */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-none">{activeOrgName} Tasks</h2>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Internal Coordination</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                    <CreateOrgTaskModal
                        activeOrgId={activeOrgId!}
                        isOpen={isCreateModalOpen}
                        onOpenChange={setIsCreateModalOpen}
                        initialStatus={initialModalStatus}
                    />
                </div>
            </div>

            {/* Existing Kanban Board Component */}
            <KanbanBoard
                tasks={filteredTasks}
                setTasks={setTasks}
                updateTaskStatusAsync={updateTaskStatusAsync}
                onAddTask={(status) => {
                    setInitialModalStatus(status);
                    setIsCreateModalOpen(true);
                }}
            />
        </div>
    );
}
