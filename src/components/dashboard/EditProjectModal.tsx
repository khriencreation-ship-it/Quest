'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, X, Loader2 } from 'lucide-react';
import { updateProject } from '@/app/actions/projects';
import { getCompanyStaff, getProjectStaff } from '@/app/actions/staff';

type RelationItem = {
    id: string;
    name: string;
};

type Project = {
    id: string;
    organization_id: string;
    client_id: string | null;
    service_id: string | null;
    name: string;
    description: string | null;
    status: string;
    is_internal: boolean;
    start_date: string | null;
    end_date: string | null;
};

type StaffItem = {
    id: string;
    full_name: string;
    email: string;
};

type Props = {
    project: Project;
    organizations: RelationItem[];
    clients: RelationItem[];
    services: RelationItem[];
    triggerStyle?: 'icon' | 'button';
};

export default function EditProjectModal({ project, organizations, clients, services, triggerStyle = 'icon' }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOngoing, setIsOngoing] = useState(project.end_date === null);
    const [isInternal, setIsInternal] = useState(project.is_internal || false);
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [staffLoading, setStaffLoading] = useState(false);

    // Fetch staff and current assignments when modal opens
    const loadStaffData = async () => {
        setStaffLoading(true);
        try {
            const [allStaff, assignedStaff] = await Promise.all([
                getCompanyStaff(),
                getProjectStaff(project.id)
            ]);
            setStaff(allStaff);
            setSelectedStaffIds(assignedStaff.map((s: any) => s.staff_id));
        } catch (err) {
            console.error('Failed to load staff:', err);
        } finally {
            setStaffLoading(false);
        }
    };

    // Reset ongoing status when modal opens if project data changes
    useEffect(() => {
        setIsOngoing(project.end_date === null);
        setIsInternal(project.is_internal || false);
    }, [project, isOpen]);

    async function handleAction(formData: FormData) {
        setIsLoading(true);
        setError(null);

        // the 'id' must be passed to the action
        formData.append('id', project.id);
        
        // Add selected staff IDs
        selectedStaffIds.forEach(id => formData.append('staff_ids', id));

        const result = await updateProject(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setIsOpen(false);
            setIsLoading(false);
            router.refresh();
        }
    }

    if (!isOpen) {
        if (triggerStyle === 'button') {
            return (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(true);
                        loadStaffData();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors shadow-sm shrink-0"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Project
                </button>
            );
        }

        return (
            <button
                onClick={(e) => {
                    e.preventDefault(); // Stop Link bubbling if this is inside a link
                    setIsOpen(true);
                    loadStaffData();
                }}
                className="p-2 text-gray-400 hover:text-[#2eb781] hover:bg-[#2eb781]/10 rounded-xl transition-colors shrink-0"
                title="Edit Project"
            >
                <Pencil className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-64 md:pl-[368px] bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click outside to close - but this prevents bubbing anyway so it's safe inside a Link */}
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Stop bubbling to the parent Link
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Project</h2>
                        <p className="text-sm text-gray-500 mt-1">Update details or change the status of this project.</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form action={handleAction} className="p-6 space-y-5 overflow-y-auto">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={project.name}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    required
                                    defaultValue={project.status}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                >
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                defaultValue={project.description || ''}
                                placeholder="Explain the goals or scope of this project..."
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all resize-none"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Organization <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="organization_id"
                                required
                                defaultValue={project.organization_id}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                            >
                                <option value="">Select Organization...</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer touch-none">
                                <input
                                    type="radio"
                                    name="project_type"
                                    checked={!isInternal}
                                    onChange={() => setIsInternal(false)}
                                    className="w-4 h-4 text-[#2eb781] focus:ring-[#2eb781] border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-900">Client Project</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer touch-none">
                                <input
                                    type="radio"
                                    name="project_type"
                                    checked={isInternal}
                                    onChange={() => setIsInternal(true)}
                                    className="w-4 h-4 text-[#2eb781] focus:ring-[#2eb781] border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-900">Internal Project</span>
                            </label>
                            {isInternal && <input type="hidden" name="is_internal" value="on" />}
                        </div>

                        <div className={`grid ${isInternal ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                            {!isInternal && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Client <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="client_id"
                                        required={!isInternal}
                                        defaultValue={project.client_id || ''}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                    >
                                        <option value="">Select Client...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Service Connected <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="service_id"
                                    required
                                    defaultValue={project.service_id || ''}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                >
                                    <option value="">Select Service...</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>{service.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Staff Assignment Section */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Assign Team Members
                            </label>
                            {staffLoading ? (
                                <div className="flex h-[150px] items-center justify-center bg-gray-50 rounded-xl border border-dashed">
                                    <Loader2 className="w-5 h-5 text-[#2eb781] animate-spin" />
                                </div>
                            ) : staff.length === 0 ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed text-center">No staff members found in your company.</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                                        {staff.map((member) => (
                                            <label key={member.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all hover:bg-gray-50 grow sm:grow-0 min-w-[200px] ${selectedStaffIds.includes(member.id) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-100'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStaffIds.includes(member.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStaffIds(prev => [...prev, member.id]);
                                                        } else {
                                                            setSelectedStaffIds(prev => prev.filter(id => id !== member.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-[#2eb781] focus:ring-[#2eb781] rounded"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{member.full_name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        Team members with access to this project workspace.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-2 cursor-pointer mb-4 w-max">
                                <input
                                    type="checkbox"
                                    name="is_ongoing"
                                    checked={isOngoing}
                                    onChange={(e) => setIsOngoing(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#2eb781] focus:ring-[#2eb781]"
                                />
                                <span className="text-sm font-semibold text-gray-700">This is an ongoing project (Retainer / Continuous)</span>
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        defaultValue={project.start_date || ''}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                    />
                                </div>
                                <div className={`${isOngoing ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        disabled={isOngoing}
                                        defaultValue={project.end_date || ''}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 mt-auto">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-[#2eb781] hover:bg-[#279e6f] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
