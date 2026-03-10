'use client';

import { useState } from 'react';
import {
    FolderKanban, Calendar, Clock, Building2, UserCircle,
    Layers, Search, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format, formatDistance } from 'date-fns';
import CreateProjectModal from './CreateProjectModal';
import EditProjectModal from './EditProjectModal';
import DeleteProjectButton from './DeleteProjectButton';

type ProjectRelation = { name: string } | null;

type Project = {
    id: string;
    name: string;
    description: string | null;
    status: string;
    is_internal: boolean;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    organizations: ProjectRelation;
    clients: ProjectRelation;
    services: ProjectRelation;
};
type RelationItem = {
    id: string;
    name: string;
};

export default function ProjectsClient({
    initialProjects,
    organizations,
    clients,
    services
}: {
    initialProjects: Project[],
    organizations: RelationItem[],
    clients: RelationItem[],
    services: RelationItem[]
}) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredProjects = initialProjects.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
            p.organizations?.name.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'on_hold': return 'bg-amber-100 text-amber-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'planning': default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDuration = (start: string | null, end: string | null) => {
        if (!start && !end) return 'TBD';
        if (start && end) {
            try {
                return `${format(new Date(start), 'MMM d, yy')} - ${format(new Date(end), 'MMM d, yy')}`;
            } catch (e) {
                return 'Invalid Date';
            }
        }
        if (start) return `Started ${format(new Date(start), 'MMM d, yy')}`;
        return `Due ${format(new Date(end!), 'MMM d, yy')}`;
    };

    return (
        <div className="space-y-6">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects, clients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-sm"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-sm shrink-0"
                    >
                        <option value="all">All Statuses</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                    <CreateProjectModal
                        organizations={organizations}
                        clients={clients}
                        services={services}
                    />
                </div>
            </div>

            {/* List */}
            {filteredProjects.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FolderKanban className="w-8 h-8" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">No projects found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                        {initialProjects.length === 0
                            ? "Your company doesn't have any active projects yet. Projects are created within individual Organizations."
                            : "No projects match your current search constraints."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredProjects.map(project => (
                        <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full group relative overflow-hidden block hover:border-[#2eb781]/30">

                            {/* Top row */}
                            <div className="flex justify-between items-start mb-4 gap-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-[#2eb781] transition-colors line-clamp-1">{project.name}</h3>
                                    {project.services?.name && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2eb781] bg-[#2eb781]/10 w-max px-2 py-0.5 rounded-md">
                                            <Layers className="w-3 h-3" /> {project.services.name}
                                        </div>
                                    )}
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${getStatusColor(project.status)}`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6 mt-2">
                                {/* Organization */}
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Organization</span>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="truncate">{project.organizations?.name || 'Unknown'}</span>
                                    </div>
                                </div>

                                {/* Client */}
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</span>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                        <UserCircle className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="truncate">{project.clients?.name || 'Internal'}</span>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="space-y-1 col-span-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timeline</span>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span>{formatDuration(project.start_date, project.end_date)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 relative z-20">
                                <div className="flex items-center gap-1.5" title={`Created ${format(new Date(project.created_at), 'PPP')}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Added {formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <EditProjectModal
                                        project={{
                                            id: project.id,
                                            organization_id: (project as any).organization_id || '', // we need to adjust the type to fetch org_id
                                            client_id: (project as any).client_id || '',
                                            service_id: (project as any).service_id || '',
                                            name: project.name,
                                            description: project.description,
                                            status: project.status,
                                            is_internal: (project as any).is_internal || false,
                                            start_date: project.start_date,
                                            end_date: project.end_date
                                        }}
                                        organizations={organizations}
                                        clients={clients}
                                        services={services}
                                    />
                                    <DeleteProjectButton projectId={project.id} projectName={project.name} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
