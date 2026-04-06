'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Building2, Trash2, Download, Search, Loader2, User, Pencil } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { deleteOrgDocument } from '@/app/actions/org_documents';
import UploadOrgDocumentModal from './UploadOrgDocumentModal';
import ConfirmationModal from '../ConfirmationModal';
import EditOrgDocumentModal from './EditOrgDocumentModal';

export type OrgDocument = {
    id: string;
    organization_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    category: string;
    created_at: string;
    uploaded_by: string;
    uploader_name: string;
    users?: { email: string } | null;
};

type RelationItem = {
    id: string;
    name: string;
};

export default function OrgDocumentsClient({
    initialDocuments,
    organizations,
    currentUserId
}: {
    initialDocuments: OrgDocument[],
    organizations: RelationItem[],
    currentUserId: string
}) {
    const searchParams = useSearchParams();
    const activeOrgId = searchParams.get('org');
    const isCompanyLevel = !activeOrgId;

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [documentToDelete, setDocumentToDelete] = useState<{ id: string; url: string; name: string } | null>(null);
    const [documentToEdit, setDocumentToEdit] = useState<{ id: string; name: string } | null>(null);

    const activeOrgName = organizations.find(o => o.id === activeOrgId)?.name;

    const categories = ['All', 'Guidelines & SOPs', 'Templates', 'Meeting Notes', 'General'];

    // Filter documents
    const filteredDocs = initialDocuments.filter(doc => {
        if (!isCompanyLevel && doc.organization_id !== activeOrgId) return false;

        const matchesSearch = doc.file_name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    console.log("filteredDocs:", filteredDocs)
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const router = useRouter();

    const handleDelete = async () => {
        if (!documentToDelete) return;

        setDeletingId(documentToDelete.id);
        const result = await deleteOrgDocument(documentToDelete.id, documentToDelete.url);

        if (result.success) {
            setDocumentToDelete(null);
            router.refresh();
        } else {
            alert(result.error || 'Failed to delete document');
        }
        setDeletingId(null);
    };

    // 1. Initial State: No organization selected
    if (isCompanyLevel) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                    <Building2 className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select an Organization</h2>
                <p className="text-gray-500 max-w-sm mb-8">
                    To view and manage the knowledge base, please select an organization from the left sidebar switcher.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                    {organizations.map(org => (
                        <Link
                            key={org.id}
                            href={`/dashboard/documents?org=${org.id}`}
                            className="p-4 bg-white border border-gray-200 rounded-2xl hover:border-[#2eb781] hover:bg-emerald-50/30 transition-all text-left group"
                        >
                            <p className="font-bold text-gray-900 group-hover:text-[#2eb781]">{org.name}</p>
                            <p className="text-xs text-gray-500 mt-1">View Knowledge Base</p>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mr-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-none">{activeOrgName} Knowledge Base</h2>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Shared Organization Documents</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all shadow-sm"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                    <UploadOrgDocumentModal activeOrgId={activeOrgId} />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-100 no-scrollbar mb-4 px-1">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap pb-3 text-sm font-medium transition-all relative ${selectedCategory === cat
                            ? 'text-[#2eb781]'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                            }`}
                    >
                        {cat}
                        {selectedCategory === cat && (
                            <span className="absolute -bottom-px left-0 w-full h-[2px] bg-[#2eb781] rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Documents Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                        <FileText className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-500">No documents found.</p>
                        <p className="text-xs text-gray-400 mt-1">Upload files to share with your workspace.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredDocs.map(doc => (
                            <div key={doc.id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-[#2eb781]/30 transition-all group flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-[#2eb781] transition-colors" />
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 bg-gray-50 text-gray-600 hover:text-[#2eb781] hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Download/View"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        {(doc.uploaded_by === currentUserId) && (
                                            <>
                                                <button
                                                    onClick={() => setDocumentToEdit({ id: doc.id, name: doc.file_name })}
                                                    className="p-1.5 bg-gray-50 text-gray-600 hover:text-[#2eb781] hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Rename Document"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDocumentToDelete({ id: doc.id, url: doc.file_url, name: doc.file_name })}
                                                    disabled={deletingId === doc.id}
                                                    className="p-1.5 bg-gray-50 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete Document"
                                                >
                                                    {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm truncate mb-1 group-hover:text-[#2eb781] transition-colors" title={doc.file_name}>
                                        {doc.file_name}
                                    </h4>
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold tracking-wide uppercase">
                                        {doc.category}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                                        <User className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{doc.uploader_name.split(' ')[0]}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium tracking-tight">
                                    <span>{formatBytes(doc.file_size)}</span>
                                    <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!documentToDelete}
                onClose={() => setDocumentToDelete(null)}
                onConfirm={handleDelete}
                isLoading={!!deletingId}
                title="Delete Document"
                message={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
                confirmLabel="Yes, Delete Document"
            />

            <EditOrgDocumentModal
                isOpen={!!documentToEdit}
                onClose={() => setDocumentToEdit(null)}
                documentId={documentToEdit?.id || ''}
                currentName={documentToEdit?.name || ''}
            />
        </div>
    );
}
