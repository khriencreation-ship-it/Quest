'use client';

import { useState, useEffect } from 'react';
import {
    FileText, ImageIcon, Film, FileSpreadsheet, Archive, Download, Trash2,
    Loader2, MoreVertical, Calendar, User,
    Pencil
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { deleteDocument, type ProjectDocument } from '@/app/actions/documents';
import ConfirmationModal from '../ConfirmationModal';
import EditDocumentModal from './EditDocumentModal';

function getFileIcon(fileType: string) {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (fileType.startsWith('video/')) return <Film className="w-6 h-6" />;
    if (fileType.includes('spreadsheet') || fileType === 'text/csv') return <FileSpreadsheet className="w-6 h-6" />;
    if (fileType === 'application/zip') return <Archive className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
}

function getFileBadge(fileType: string): { label: string; color: string } {
    if (fileType.startsWith('image/')) return { label: 'Image', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (fileType.startsWith('video/')) return { label: 'Video', color: 'bg-purple-50 text-purple-700 border-purple-100' };
    if (fileType === 'application/pdf') return { label: 'PDF', color: 'bg-red-50 text-red-700 border-red-100' };
    if (fileType.includes('wordprocessing')) return { label: 'DOCX', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (fileType.includes('spreadsheet')) return { label: 'XLSX', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (fileType.includes('presentation')) return { label: 'PPTX', color: 'bg-orange-50 text-orange-700 border-orange-100' };
    if (fileType === 'text/csv') return { label: 'CSV', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (fileType === 'application/zip') return { label: 'ZIP', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    return { label: 'File', color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
    document: ProjectDocument;
    currentUserId: string;
    isOwner: boolean;
    onDelete: () => void;
    onUpdate?: () => void;
};

export default function DocumentCard({ document: doc, currentUserId, isOwner, onDelete, onUpdate }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    const badge = getFileBadge(doc.file_type);
    const canDelete = isOwner || doc.uploaded_by === currentUserId;
    const isImage = doc.file_type.startsWith('image/');

    // Generate thumbnail URL for images
    useEffect(() => {
        const fetchSignedUrl = async () => {
            if (isImage) {
                const supabase = createClient();
                const { data, error } = await supabase.storage
                    .from('project-documents')
                    .createSignedUrl(doc.file_url, 3600); // 1 hour expiry
                
                if (error) {
                    console.error('Error creating signed URL for image:', error);
                } else if (data?.signedUrl) {
                    setImageUrl(data.signedUrl);
                }
            } else {
                setImageUrl(null);
            }
        };

        fetchSignedUrl();
    }, [isImage, doc.file_url]);

    const handleDownload = async () => {
        const supabase = createClient();
        const { data, error } = await supabase.storage
            .from('project-documents')
            .createSignedUrl(doc.file_url, 60);

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setShowDeleteModal(false);
        setMenuOpen(false);

        const result = await deleteDocument(doc.id, doc.file_url, doc.project_id);
        if (result.error) {
            alert(result.error);
            setDeleting(false);
        } else {
            onDelete();
        }
    };

    const handleEditDoc = () => {
        setShowEditModal(true);
        setMenuOpen(false);
    };

    return (
        <div className={`group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all ${deleting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Thumbnail Area */}
            <div className="relative h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
                {isImage && imageUrl ? (
                    <>
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                            </div>
                        )}
                        <img
                            src={imageUrl}
                            alt={doc.file_name}
                            className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                        />
                    </>
                ) : (
                    <div className="text-gray-300">
                        {getFileIcon(doc.file_type)}
                    </div>
                )}

                {/* Type Badge */}
                <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}>
                    {badge.label}
                </span>

                {/* Action Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                                    <button
                                        onClick={handleEditDoc}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-400" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { handleDownload(); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Download className="w-4 h-4 text-gray-400" />
                                        Download
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3.5">
                <button
                    onClick={handleDownload}
                    className="text-sm font-semibold text-gray-900 truncate block w-full text-left hover:text-[#2eb781] transition-colors"
                    title={doc.file_name}
                >
                    {doc.file_name}
                </button>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{doc.uploader_name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(doc.created_at)}
                </div>
            </div>

            {/* Deleting overlay */}
            {deleting && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                isLoading={deleting}
                title="Delete Document"
                message={`Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`}
                confirmLabel="Yes, Delete Document"
            />

            <EditDocumentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={onUpdate}
                documentId={doc.id}
                currentName={doc.file_name}
                projectId={doc.project_id}
            />
        </div>
    );
}
