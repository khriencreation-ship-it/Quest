'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2, FileText, FolderOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getProjectDocuments, type ProjectDocument } from '@/app/actions/documents';
import DocumentCard from './DocumentCard';
import UploadDocumentModal from './UploadDocumentModal';

type ProjectDocumentsTabProps = {
    projectId: string;
};

const ProjectDocumentsTab = ({ projectId }: ProjectDocumentsTabProps) => {
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [companyId, setCompanyId] = useState('');

    const fetchDocuments = useCallback(async () => {
        try {
            const data = await getProjectDocuments(projectId);
            setDocuments(data);
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Initial load: get user info + documents
    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);

                // Check if user is company owner
                const { data: company } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (company) {
                    setIsOwner(true);
                    setCompanyId(company.id);
                } else {
                    // Staff user — get company from staffs table
                    const { data: staff } = await supabase
                        .from('staffs')
                        .select('company_id')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (staff) setCompanyId(staff.company_id);
                }
            }
            await fetchDocuments();
        };
        init();
    }, [projectId, fetchDocuments]);

    const filteredDocuments = documents.filter(doc =>
        doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
        doc.uploader_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-[600px] items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#2eb781] animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-[500px] bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-500 relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 bg-white flex items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">
                        {filteredDocuments.length} file{filteredDocuments.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-lg text-sm font-bold hover:bg-[#259b6d] transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Upload File
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                {filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                            {documents.length === 0 ? (
                                <FolderOpen className="w-8 h-8 text-gray-300" />
                            ) : (
                                <Search className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {documents.length === 0 ? 'No documents yet' : 'No results found'}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            {documents.length === 0
                                ? 'Upload your first document to share with the project team.'
                                : 'Try adjusting your search term.'}
                        </p>
                        {documents.length === 0 && (
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-bold hover:bg-[#259b6d] transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Upload First File
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredDocuments.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                currentUserId={currentUserId}
                                isOwner={isOwner}
                                onDelete={fetchDocuments}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadOpen && (
                <UploadDocumentModal
                    projectId={projectId}
                    companyId={companyId}
                    onClose={() => setIsUploadOpen(false)}
                    onUploadComplete={fetchDocuments}
                />
            )}
        </div>
    );
};

export default ProjectDocumentsTab;