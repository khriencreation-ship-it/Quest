'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Building2, Calendar, Paperclip, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { format, isPast } from 'date-fns';
import CreateOrgTaskModal from './CreateOrgTaskModal';
// import EditOrgTaskModal from './EditOrgTaskModal';

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
    const [filter, setFilter] = useState('all'); // all, my_tasks

    const activeOrgName = organizations.find(o => o.id === activeOrgId)?.name;

    // Filter tasks
    const filteredTasks = initialTasks.filter(t => {
        if (!isCompanyLevel && t.organization_id !== activeOrgId) return false;

        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());

        // My Tasks filter (Assuming we pass userId or handle this in Edit modal, but for now we just structure the layout)

        return matchesSearch;
    });

    const columns = [
        { id: 'todo', title: 'To Do', color: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        { id: 'done', title: 'Done', color: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    ] as const;

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
        <div className="flex flex-col h-full space-y-6">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mr-2">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-none">{activeOrgName} Tasks</h2>
                            <p className="text-xs text-gray-500 mt-1 font-medium italic">Internal Coordination</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                    <CreateOrgTaskModal
                        activeOrgId={activeOrgId}
                    />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-max h-full items-start">
                    {columns.map(col => {
                        const colTasks = filteredTasks.filter(t => t.status === col.id);

                        return (
                            <div key={col.id} className="w-[320px] flex flex-col bg-gray-50/50 border border-gray-100 rounded-2xl p-3 max-h-full">
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h3 className={`font-bold text-sm uppercase tracking-wider ${col.text}`}>
                                        {col.title}
                                    </h3>
                                    <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                        {colTasks.length}
                                    </span>
                                </div>

                                {/* Task List */}
                                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-2">
                                    {colTasks.length === 0 ? (
                                        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                                            <p className="text-xs text-gray-400 font-medium">No tasks</p>
                                        </div>
                                    ) : (
                                        colTasks.map(task => {
                                            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
                                            const assigneesCount = task.org_task_assignees?.length || 0;
                                            const hasAttachments = task.org_task_attachments && task.org_task_attachments.length > 0;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#2eb781]/30 transition-all cursor-pointer group"
                                                // onClick={() => openEditModal(task)}
                                                >
                                                    <h4 className="font-semibold text-gray-900 text-sm mb-2 leading-tight group-hover:text-[#2eb781] transition-colors line-clamp-2">
                                                        {task.title}
                                                    </h4>

                                                    {task.due_date && (
                                                        <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            {hasAttachments && (
                                                                <div className="flex items-center gap-1 text-gray-400">
                                                                    <Paperclip className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-bold">{task.org_task_attachments?.length}</span>
                                                                </div>
                                                            )}
                                                            {task.description && (
                                                                <div className="text-gray-400">
                                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {assigneesCount > 0 && (
                                                            <div className="flex -space-x-1.5">
                                                                {task.org_task_assignees?.slice(0, 3).map((assignee, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border border-white flex items-center justify-center text-[9px] font-bold"
                                                                        title={assignee?.staffs?.full_name || 'Staff Member'}
                                                                    >
                                                                        {assignee?.staffs?.full_name?.substring(0, 2).toUpperCase() || '??'}
                                                                    </div>
                                                                ))}
                                                                {assigneesCount > 3 && (
                                                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 border border-white flex items-center justify-center text-[9px] font-bold">
                                                                        +{assigneesCount - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
