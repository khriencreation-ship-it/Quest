'use client';

import { useState, useEffect } from 'react';
import { updateOrganization, deleteOrganization } from '@/app/actions/organization';
import { Loader2, Trash2, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
    organization: {
        id: string;
        name: string;
        description: string | null;
    }
};

export default function OrgSettingsForm({ organization }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [name, setName] = useState(organization.name);
    const [description, setDescription] = useState(organization.description || '');
    const router = useRouter();

    // Sync local state whenever fresh props arrive (after router.refresh())
    useEffect(() => {
        setName(organization.name);
        setDescription(organization.description || '');
    }, [organization.name, organization.description]);

    function handleCancelEdit() {
        // Reset to last saved values
        setName(organization.name);
        setDescription(organization.description || '');
        setMessage({ type: '', text: '' });
        setIsEditing(false);
    }

    async function handleUpdate(formData: FormData) {
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        const result = await updateOrganization(organization.id, formData);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Organization updated successfully.' });
            setIsEditing(false);
            router.refresh();
        }
        setIsLoading(false);
    }

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        const result = await deleteOrganization(organization.id);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
            setIsDeleting(false);
        } else {
            router.push('/dashboard/organizations');
            router.refresh();
        }
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Workspace Settings</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage the name and description of this workspace.</p>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => { setIsEditing(true); setMessage({ type: '', text: '' }); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    )}
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'error'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {message.text}
                    </div>
                )}

                {isEditing ? (
                    // ── EDIT MODE ──────────────────────────────────────────
                    <form action={handleUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all bg-gray-50 focus:bg-white text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1.5">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is the purpose of this workspace?"
                                className="w-full px-4 py-3 text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all bg-gray-50 focus:bg-white text-sm resize-none"
                            />
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !name.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2eb781] text-white font-semibold hover:bg-[#279e6f] transition-all disabled:opacity-50 text-sm shadow-sm"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    // ── READ-ONLY VIEW ──────────────────────────────────────
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Organization Name</p>
                            <p className="text-gray-900 font-semibold">{name}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-gray-700 text-sm">
                                {description || <span className="text-gray-400 italic">No description set.</span>}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                        <p className="text-sm text-red-700/80 mt-1">Permanently delete this workspace and all its data.</p>
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || organization.name === 'General'}
                        title={organization.name === 'General' ? "You cannot delete the General workspace" : "Delete workspace"}
                        className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-red-200"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}
