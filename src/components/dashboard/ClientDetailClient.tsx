'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateClient, deleteClient } from '@/app/actions/clients';
import {
    ArrowLeft, Building2, Mail, Phone, ExternalLink,
    Copy, Check, Edit, FolderKanban, Calendar, Loader2
} from 'lucide-react';

type Client = {
    id: string;
    company_name: string | null;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    notes: string | null;
    portal_token: string;
    created_at: string;
};

export default function ClientDetailClient({ client }: { client: Client }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [portalUrl, setPortalUrl] = useState('');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company_name: client.company_name || '',
        status: client.status,
        notes: client.notes || ''
    });

    useEffect(() => {
        // Construct portal URL on client side to get the correct origin
        setPortalUrl(`${window.location.origin}/portal/${client.portal_token}`);
    }, [client.portal_token]);

    function copyToClipboard() {
        if (!portalUrl) return;
        navigator.clipboard.writeText(portalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        const res = await updateClient(client.id, formData);
        if (res.error) {
            setError(res.error);
            setIsSaving(false);
        } else {
            setIsEditModalOpen(false);
            setIsSaving(false);
            // The server action revalidates the path, so the page will refresh with new data
        }
    }

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) return;

        const res = await deleteClient(client.id);
        if (res.error) {
            alert(res.error);
        } else {
            router.push('/dashboard/clients');
        }
    }

    const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-sm text-gray-900";

    return (
        <div className="space-y-6 max-w-5xl">

            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-3">
                        {client.name}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            client.status === 'lead' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                            {client.status}
                        </span>
                    </h1>
                    {client.company_name ? (
                        <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> {client.company_name}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 mt-1">Client Profile</p>
                    )}
                </div>
                <div className="ml-auto flex gap-3">
                    <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                        <Edit className="w-4 h-4" /> Edit Profile
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Contact & Portal Info */}
                <div className="space-y-6 lg:col-span-1">

                    {/* Contact Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">Contact Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{client.email}</p>
                                    <p className="text-xs text-gray-500">Primary Email</p>
                                </div>
                            </div>
                            {client.phone && (
                                <div className="flex items-start gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900">{client.phone}</p>
                                        <p className="text-xs text-gray-500">Phone Number</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{new Date(client.created_at).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-500">Added Date</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Internal Notes</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                {client.notes || <span className="text-gray-400 italic">No notes added.</span>}
                            </p>
                        </div>
                    </div>

                    {/* Portal Link Card */}
                    <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                            <ExternalLink className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-1">Client Portal</h3>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Share this secure link with {client.name.split(' ')[0]} so they can view their active projects,
                            make approvals, and track status.
                        </p>

                        <div className="flex items-center gap-2 p-1.5 bg-white border border-emerald-200 rounded-lg shadow-inner">
                            <input
                                type="text"
                                readOnly
                                value={portalUrl}
                                className="w-full bg-transparent text-xs text-gray-600 px-2 outline-none font-mono truncate"
                            />
                            <button
                                onClick={copyToClipboard}
                                className={`shrink-0 p-1.5 rounded-md transition-colors ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                title="Copy secure portal link"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Projects Overview */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FolderKanban className="w-5 h-5" />
                                </div>
                                <h2 className="text-base font-bold text-gray-900">Projects Overview</h2>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">0 Active</span>
                        </div>

                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-4 transform -rotate-6">
                                <FolderKanban className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">No Projects Found</h3>
                            <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">
                                {client.name} doesn't have any projects associated with them yet.
                            </p>
                            {/* In the future, this button will link to a "Create Project" flow with this client pre-selected */}
                            <button className="mt-6 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-gray-800 transition-colors">
                                Add New Project
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Edit Modal (Reused inline to keep component self-contained) */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shrink-0 w-full max-w-md overflow-hidden shadow-2xl flex flex-col m-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Edit Client Details</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Client Name *</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="Jane Doe" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email Address *</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} placeholder="jane@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Company Name</label>
                                    <input type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className={inputCls} placeholder="Acme Corp" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="+1 234 567 890" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={inputCls}>
                                        <option value="active">Active Client</option>
                                        <option value="lead">Lead / Prospect</option>
                                        <option value="inactive">Inactive / Past</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Internal Notes</label>
                                    <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={`${inputCls} resize-none`} placeholder="Optional context or background info..." />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 md:mt-6 pt-4 border-t border-gray-100">
                                <button type="button" onClick={handleDelete} className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline">
                                    Delete Client
                                </button>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50">
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
