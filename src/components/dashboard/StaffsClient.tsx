'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil, X, Check, Loader2, Users, Eye, EyeOff, Phone, Mail, UserCog, Briefcase, ShieldCheck, KeyRound } from 'lucide-react';
import { createStaff, deleteStaff, updateStaff, upsertOwnerAsStaff, resetStaffPassword } from '@/app/actions/staffs';
import { useRouter } from 'next/navigation';

type Role = { id: string; name: string };

type Staff = {
    id: string;
    user_id: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    role_id: string | null;
    contract_type: string | null;
    is_manager: boolean;
    isOwner?: boolean;
    created_at: string;
};

type Props = {
    staffs: Staff[];
    roles: Role[];
};

const CONTRACT_TYPES = [
    { value: 'full_time', label: 'Full-time Staff' },
    { value: 'contract', label: 'Contract Staff' },
    { value: 'intern', label: 'Intern' },
];

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900 placeholder-gray-400';

function getContractLabel(val: string | null) {
    return CONTRACT_TYPES.find(c => c.value === val)?.label || 'Full-time Staff';
}

function getInitials(name: string) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
}

export default function StaffsClient({ staffs, roles }: Props) {
    const router = useRouter();

    // Drawer / modal state
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ first_name: '', last_name: '', email: '', phone: '', role_id: '', contract_type: 'full_time' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Password reset state
    const [resetTarget, setResetTarget] = useState<Staff | null>(null);
    const [resetPassword, setResetPassword] = useState('');
    const [showResetPw, setShowResetPw] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    function openReset(s: Staff) {
        setResetTarget(s);
        setResetPassword('');
        setResetError('');
        setResetSuccess(false);
        setShowResetPw(false);
    }

    async function handleResetPassword() {
        if (!resetTarget?.user_id) return;
        setResetLoading(true);
        setResetError('');
        setResetSuccess(false);
        const result = await resetStaffPassword(resetTarget.user_id, resetPassword);
        if (result.error) {
            setResetError(result.error);
        } else {
            setResetSuccess(true);
            setResetPassword('');
        }
        setResetLoading(false);
    }

    // ── Create ─────────────────────────────────────────────────────────────────
    async function handleCreate(formData: FormData) {
        setCreating(true);
        setCreateError('');
        const result = await createStaff(formData);
        if (result.error) {
            setCreateError(result.error);
        } else {
            setShowForm(false);
            router.refresh();
        }
        setCreating(false);
    }

    // ── Edit ───────────────────────────────────────────────────────────────────
    function startEdit(s: Staff) {
        setEditingId(s.id);
        setEditData({
            first_name: s.first_name || '',
            last_name: s.last_name || '',
            email: s.email || '',
            phone: s.phone || '',
            role_id: s.role_id || '',
            contract_type: s.contract_type || 'full_time',
        });
        setEditError('');
    }

    async function handleUpdate(id: string, isOwner?: boolean) {
        setEditLoading(true);
        setEditError('');
        const formData = new FormData();
        Object.entries(editData).forEach(([k, v]) => formData.set(k, v));

        // Owner rows don't have a real staffs ID — upsert them into the table instead
        const result = isOwner
            ? await upsertOwnerAsStaff(formData)
            : await updateStaff(id, formData);

        if (result.error) {
            setEditError(result.error);
        } else {
            setEditingId(null);
            router.refresh();
        }
        setEditLoading(false);
    }

    // ── Delete ─────────────────────────────────────────────────────────────────
    async function handleDelete(s: Staff) {
        if (!confirm(`Remove "${s.full_name}" from your company? Their login access will also be revoked.`)) return;
        setDeletingId(s.id);
        const result = await deleteStaff(s.id, s.user_id);
        if (result.error) alert(result.error);
        else router.refresh();
        setDeletingId(null);
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
                    <p className="text-gray-500 mt-1">Manage all staff members in your company.</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setCreateError(''); setShowPassword(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Staff
                </button>
            </div>

            {/* Password Reset Modal */}
            {resetTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !resetLoading && setResetTarget(null)} />
                    <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                    <KeyRound className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Reset Password</h2>
                                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{resetTarget.full_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setResetTarget(null)} disabled={resetLoading} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showResetPw ? 'text' : 'password'}
                                        value={resetPassword}
                                        onChange={e => { setResetPassword(e.target.value); setResetError(''); setResetSuccess(false); }}
                                        placeholder="Min. 6 characters"
                                        className={inputCls}
                                        onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setShowResetPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        {showResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {resetError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{resetError}</p>}
                            {resetSuccess && (
                                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                                    <Check className="w-4 h-4 shrink-0" />
                                    Password updated successfully!
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setResetTarget(null)} disabled={resetLoading}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={handleResetPassword} disabled={resetLoading || resetPassword.length < 6}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 shadow-sm">
                                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                    {resetLoading ? 'Saving...' : 'Set Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !creating && setShowForm(false)} />

                    {/* Modal Panel */}
                    <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#2eb781]/10 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[#2eb781]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Add Staff Member</h2>
                            </div>
                            <button onClick={() => setShowForm(false)} disabled={creating} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form action={handleCreate} className="p-6 space-y-4">
                            {/* Name Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        First Name <span className="text-red-400">*</span>
                                    </label>
                                    <input type="text" name="first_name" required placeholder="John" className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Last Name <span className="text-red-400">*</span>
                                    </label>
                                    <input type="text" name="last_name" required placeholder="Doe" className={inputCls} />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type="email" name="email" required placeholder="john@example.com" className={`${inputCls} pl-10`} />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type="tel" name="phone" placeholder="+1 234 567 8900" className={`${inputCls} pl-10`} />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        minLength={6}
                                        placeholder="Min. 6 characters"
                                        className={`${inputCls} pr-10`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Role + Contract Type Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /> Role</span>
                                    </label>
                                    <select name="role_id" className={inputCls}>
                                        <option value="">No role</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Contract Type</span>
                                    </label>
                                    <select name="contract_type" className={inputCls}>
                                        {CONTRACT_TYPES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Manager Access */}
                            <label className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl cursor-pointer hover:bg-purple-100/60 transition-colors">
                                <input
                                    type="checkbox"
                                    name="manager_access"
                                    value="true"
                                    className="mt-0.5 w-4 h-4 accent-purple-600 rounded cursor-pointer"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4" />
                                        Grant Manager Access
                                    </p>
                                    <p className="text-xs text-purple-700/80 mt-0.5">
                                        This person can log in and manage organizations, staff, roles, and company settings.
                                    </p>
                                </div>
                            </label>

                            {createError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{createError}</p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} disabled={creating}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2eb781] text-white font-semibold text-sm hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-sm">
                                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff List */}
            {staffs.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-16 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No staff yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs">Add your first staff member to get started.</p>
                    <button onClick={() => setShowForm(true)}
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add First Staff Member
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span>Staff Member</span>
                        <span>Contact</span>
                        <span>Role / Contract</span>
                        <span className="text-right">Actions</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {staffs.map((s) => {
                            const roleName = roles.find(r => r.id === s.role_id)?.name;
                            return (
                                <div key={s.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    {editingId === s.id ? (
                                        // ── Inline edit ──
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input value={editData.first_name} onChange={e => setEditData(d => ({ ...d, first_name: e.target.value }))} placeholder="First name" className={inputCls} />
                                                <input value={editData.last_name} onChange={e => setEditData(d => ({ ...d, last_name: e.target.value }))} placeholder="Last name" className={inputCls} />
                                            </div>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} placeholder="Email address" className={`${inputCls} pl-10`} />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                <input value={editData.phone} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} placeholder="Phone (optional)" className={`${inputCls} pl-10`} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select value={editData.role_id} onChange={e => setEditData(d => ({ ...d, role_id: e.target.value }))} className={inputCls}>
                                                    <option value="">No role</option>
                                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                                <select value={editData.contract_type} onChange={e => setEditData(d => ({ ...d, contract_type: e.target.value }))} className={inputCls}>
                                                    {CONTRACT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                            </div>
                                            {editError && <p className="text-sm text-red-600">{editError}</p>}
                                            {/* Inline edit save row */}
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <X className="w-3.5 h-3.5" /> Cancel
                                                </button>
                                                <button onClick={() => handleUpdate(s.id, s.isOwner)} disabled={editLoading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#2eb781] hover:bg-[#279e6f] rounded-xl transition-colors disabled:opacity-50">
                                                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // ── Read view ──
                                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center">
                                            {/* Name + Avatar */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-[#2eb781]/10 border border-[#2eb781]/20 flex items-center justify-center text-sm font-bold text-[#2eb781] shrink-0">
                                                    {getInitials(s.full_name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 truncate">{s.full_name}</p>
                                                        {s.is_manager && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 shrink-0">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                Manager
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                                                </div>
                                            </div>

                                            {/* Contact */}
                                            <div className="min-w-0">
                                                {s.phone ? (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate">{s.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No phone</span>
                                                )}
                                            </div>

                                            {/* Role + Contract */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleName ? 'bg-[#2eb781]/10 text-[#2eb781]' : 'bg-gray-100 text-gray-500'}`}>
                                                        <UserCog className="w-3 h-3" />
                                                        {roleName || 'No role'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.contract_type === 'contract' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        <Briefcase className="w-3 h-3" />
                                                        {getContractLabel(s.contract_type)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions — Edit for all, Delete only for non-owner rows */}
                                            <div className="flex items-center gap-1 justify-end">
                                                {s.isOwner ? (
                                                    <>
                                                        <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit your profile">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <span className="px-2 py-1 text-xs text-gray-400 italic">Account owner</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        {s.user_id && (
                                                            <button onClick={() => openReset(s)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reset password">
                                                                <KeyRound className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(s)} disabled={deletingId === s.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Remove">
                                                            {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {staffs.length > 0 && (
                <p className="text-sm text-gray-400 text-right">{staffs.length} staff member{staffs.length !== 1 ? 's' : ''}</p>
            )}
        </div>
    );
}
