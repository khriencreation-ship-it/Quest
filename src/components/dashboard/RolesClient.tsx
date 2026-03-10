'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil, X, Check, Loader2, UserCog } from 'lucide-react';
import { createRole, deleteRole, updateRole } from '@/app/actions/roles';
import { useRouter } from 'next/navigation';

type Role = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
};

type Props = {
    roles: Role[];
};

export default function RolesClient({ roles }: Props) {
    const router = useRouter();

    // Create form state
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Create ─────────────────────────────────────────────────────────────────
    async function handleCreate(formData: FormData) {
        setCreating(true);
        setCreateError('');
        const result = await createRole(formData);
        if (result.error) {
            setCreateError(result.error);
        } else {
            setShowForm(false);
            router.refresh();
        }
        setCreating(false);
    }

    // ── Edit ───────────────────────────────────────────────────────────────────
    function startEdit(role: Role) {
        setEditingId(role.id);
        setEditName(role.name);
        setEditDescription(role.description || '');
        setEditError('');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditError('');
    }

    async function handleUpdate(id: string) {
        setEditLoading(true);
        setEditError('');
        const formData = new FormData();
        formData.set('name', editName);
        formData.set('description', editDescription);
        const result = await updateRole(id, formData);
        if (result.error) {
            setEditError(result.error);
        } else {
            setEditingId(null);
            router.refresh();
        }
        setEditLoading(false);
    }

    // ── Delete ─────────────────────────────────────────────────────────────────
    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete the role "${name}"? This cannot be undone.`)) return;
        setDeletingId(id);
        const result = await deleteRole(id);
        if (result.error) {
            alert(result.error);
        } else {
            router.refresh();
        }
        setDeletingId(null);
    }

    const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900 placeholder-gray-400';

    return (
        <div className="space-y-6">

            {/* Header + Add button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
                    <p className="text-gray-500 mt-1">Define the roles available to staff members in your company.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setCreateError(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Role
                    </button>
                )}
            </div>

            {/* Create Role form */}
            {showForm && (
                <form
                    action={handleCreate}
                    className="bg-white rounded-2xl border border-[#2eb781]/30 shadow-sm p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-bold text-gray-900">New Role</h2>
                        <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Role Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="e.g. Designer, Sales Lead, Developer"
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Description <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            name="description"
                            rows={2}
                            placeholder="What does this role involve?"
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {createError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{createError}</p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2eb781] text-white font-semibold text-sm hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-sm"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Role'}
                        </button>
                    </div>
                </form>
            )}

            {/* Roles List */}
            {roles.length === 0 && !showForm ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <UserCog className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No roles yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs">Create your first role to start assigning responsibilities to staff members.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create First Role
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {roles.map((role) => (
                            <div key={role.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                {editingId === role.id ? (
                                    // ── Inline edit mode ──
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className={inputCls}
                                            placeholder="Role name"
                                        />
                                        <textarea
                                            rows={2}
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            className={`${inputCls} resize-none`}
                                        />
                                        {editError && (
                                            <p className="text-sm text-red-600">{editError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" /> Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdate(role.id)}
                                                disabled={editLoading || !editName.trim()}
                                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#2eb781] hover:bg-[#279e6f] rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // ── Read view ──
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#2eb781]/10 border border-[#2eb781]/20 flex items-center justify-center shrink-0">
                                                <UserCog className="w-5 h-5 text-[#2eb781]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{role.name}</p>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {role.description || <span className="italic text-gray-400">No description</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => startEdit(role)}
                                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Edit role"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role.id, role.name)}
                                                disabled={deletingId === role.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete role"
                                            >
                                                {deletingId === role.id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Role count */}
            {roles.length > 0 && (
                <p className="text-sm text-gray-400 text-right">{roles.length} role{roles.length !== 1 ? 's' : ''} defined</p>
            )}
        </div>
    );
}
