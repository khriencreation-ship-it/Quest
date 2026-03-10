'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { createProject } from '@/app/actions/projects';

type RelationItem = {
    id: string;
    name: string;
};

type Props = {
    organizations: RelationItem[];
    clients: RelationItem[];
    services: RelationItem[];
};

export default function CreateProjectModal({ organizations, clients, services }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOngoing, setIsOngoing] = useState(false);
    const [isInternal, setIsInternal] = useState(false);

    async function handleAction(formData: FormData) {
        setIsLoading(true);
        setError(null);

        const result = await createProject(formData);

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
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl hover:bg-[#279e6f] font-medium transition-colors shadow-sm"
            >
                <Plus className="w-5 h-5" />
                Add Project
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-64 md:pl-[368px] bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
                        <p className="text-sm text-gray-500 mt-1">Initialize a new project within a specific organization.</p>
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
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="e.g. Q1 Social Media Campaign"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
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
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                            >
                                <option value="">Select Organization...</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Which workspace will own this project?</p>
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
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                >
                                    <option value="">Select Service...</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>{service.name}</option>
                                    ))}
                                </select>
                            </div>
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
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
