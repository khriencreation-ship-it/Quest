'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, FileText, ImageIcon, Film, FileSpreadsheet, Archive, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { saveDocumentRecord } from '@/app/actions/documents';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_TYPES: Record<string, string[]> = {
    'image': ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/quicktime'],
    'document': [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    'other': ['application/zip', 'text/csv'],
};

const ALL_ACCEPTED = Object.values(ACCEPTED_TYPES).flat();

const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.pdf,.docx,.xlsx,.pptx,.zip,.csv';

function getFileIcon(fileType: string) {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (fileType.startsWith('video/')) return <Film className="w-8 h-8" />;
    if (fileType.includes('spreadsheet') || fileType === 'text/csv') return <FileSpreadsheet className="w-8 h-8" />;
    if (fileType === 'application/zip') return <Archive className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
    projectId: string;
    companyId: string;
    onClose: () => void;
    onUploadComplete: () => void;
};

export default function UploadDocumentModal({ projectId, companyId, onClose, onUploadComplete }: Props) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!ALL_ACCEPTED.includes(file.type)) {
            return `File type "${file.type || 'unknown'}" is not supported. Accepted: PNG, JPG, GIF, WEBP, MP4, MOV, PDF, DOCX, XLSX, PPTX, ZIP, CSV.`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File is too large (${formatFileSize(file.size)}). Maximum size is 50MB.`;
        }
        return null;
    };

    const handleFileSelect = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setSelectedFile(file);

        // Generate preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            const supabase = createClient();

            // Generate unique path: companyId/projectId/timestamp_filename
            const timestamp = Date.now();
            const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `${companyId}/${projectId}/${timestamp}_${safeName}`;

            setProgress(30);

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase
                .storage
                .from('project-documents')
                .upload(storagePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            setProgress(70);

            // Get public URL
            const { data: urlData } = supabase
                .storage
                .from('project-documents')
                .getPublicUrl(storagePath);

            // Save DB record via server action
            const result = await saveDocumentRecord({
                projectId,
                fileName: selectedFile.name,
                fileUrl: storagePath, // Store the path, not the full URL — we'll generate signed URLs
                fileType: selectedFile.type,
                fileSize: selectedFile.size,
            });

            setProgress(100);

            if (result.error) {
                throw new Error(result.error);
            }

            onUploadComplete();
            onClose();
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900">Upload Document</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Max file size: 50MB</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Drop Zone */}
                    {!selectedFile ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                                ${isDragOver
                                    ? 'border-[#2eb781] bg-[#2eb781]/5 scale-[1.01]'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                }
                            `}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragOver ? 'bg-[#2eb781]/10' : 'bg-gray-100'}`}>
                                <Upload className={`w-7 h-7 ${isDragOver ? 'text-[#2eb781]' : 'text-gray-400'}`} />
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                                {isDragOver ? 'Drop your file here' : 'Drag & drop a file here'}
                            </p>
                            <p className="text-xs text-gray-500">
                                or <span className="text-[#2eb781] font-semibold">click to browse</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-3 text-center">
                                PNG, JPG, GIF, WEBP, MP4, MOV, PDF, DOCX, XLSX, PPTX, ZIP, CSV
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_EXTENSIONS}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        /* File Preview */
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            {/* Thumbnail or Icon */}
                            <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {preview ? (
                                    <img src={preview} alt={selectedFile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-gray-400">
                                        {getFileIcon(selectedFile.type)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreview(null);
                                        setError(null);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Progress bar */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-[#2eb781] h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-center font-medium">Uploading... {progress}%</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/30">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={uploading}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-6 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-bold hover:bg-[#259b6d] transition-all shadow-lg shadow-[#2eb781]/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload File
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
