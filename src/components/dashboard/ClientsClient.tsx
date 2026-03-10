'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addClient, updateClient, deleteClient } from '@/app/actions/clients';
import { Plus, Building2, Mail, Phone, MoreVertical, Search, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Client = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    status: string;
    notes: string | null;
    created_at: string;
};

export default function ClientsClient({ initialClients, companyId }: { initialClients: Client[], companyId: string }) {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', company_name: '', status: 'active', notes: ''
    });

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(search.toLowerCase())
    );

    function openAddModal() {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', company_name: '', status: 'active', notes: '' });
        setError('');
        setIsModalOpen(true);
    }

    function openEditModal(client: Client) {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone || '',
            company_name: client.company_name || '',
            status: client.status,
            notes: client.notes || ''
        });
        setError('');
        setIsModalOpen(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        if (editingClient) {
            const res = await updateClient(editingClient.id, formData);
            if (res.error) {
                setError(res.error);
            } else if (res.data) {
                setClients(clients.map(c => c.id === editingClient.id ? res.data : c));
                setIsModalOpen(false);
            }
        } else {
            const res = await addClient(companyId, formData);
            if (res.error) {
                setError(res.error);
            } else if (res.data) {
                setClients([res.data, ...clients]);
                setIsModalOpen(false);
            }
        }
        setIsSaving(false);
    }

    async function handleDelete(client: Client) {
        if (!confirm(`Are you sure you want to delete ${client.name}?`)) return;

        const res = await deleteClient(client.id);
        if (!res.error) {
            setClients(clients.filter(c => c.id !== client.id));
        } else {
            alert(res.error);
        }
    }

    const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-sm text-gray-900";

    return (
        <div className="space-y-6">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Client
                </button>
            </div>

            {/* List */}
            {filteredClients.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg mb-2">No clients found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">Organize your client base, manage their portals, and track their active projects.</p>
                    <button onClick={openAddModal} className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-sm">
                        Add your first client
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map(client => (
                        <div key={client.id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full relative overflow-hidden">
                            {/* Top row */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center uppercase shrink-0">
                                        {client.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-tight">{client.name}</h3>
                                        {client.company_name && <p className="text-xs font-medium text-gray-500">{client.company_name}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        client.status === 'lead' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {client.status}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer actions */}
                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.preventDefault(); openEditModal(client); }} className="text-xs font-semibold text-gray-600 hover:text-emerald-600 transition-colors">
                                        Edit
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={(e) => { e.preventDefault(); handleDelete(client); }} className="text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors">
                                        Delete
                                    </button>
                                </div>

                                <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg text-xs font-bold transition-colors">
                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shrink-0 w-full max-w-md overflow-hidden shadow-2xl flex flex-col m-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                                <Search className="w-5 h-5 hidden" /> {/* Hidden placeholder for alignment if needed, standard replace with X */}
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

                            <div className="flex items-center justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50">
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingClient ? 'Save Changes' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
