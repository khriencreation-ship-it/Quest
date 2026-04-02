'use client';

import { useState, useRef } from 'react';
import { Plus, X, UploadCloud, File, Loader2 } from 'lucide-react';
import { uploadOrgDocument } from '@/app/actions/org_documents';
import { useRouter } from 'next/navigation';

type Props = {
    activeOrgId: string;
};

export default function UploadOrgDocumentModal({ activeOrgId }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState<string>('General');
    
    const inputRef = useRef<HTMLInputElement>(null);

    const categories = [
        'Guidelines & SOPs',
        'Templates',
        'Meeting Notes',
        'General'
    ];

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (file.size > 50 * 1024 * 1024) {
            setError("File size exceeds 50MB limit");
            return;
        }
        setError(null);
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !activeOrgId) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('organization_id', activeOrgId);
        formData.append('category', category);

        const result = await uploadOrgDocument(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setIsOpen(false);
            setSelectedFile(null);
            setCategory('General');
            setIsLoading(false);
            router.refresh();
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl hover:bg-[#279e6f] font-medium transition-colors shadow-sm"
            >
                <Plus className="w-5 h-5" />
                Upload Document
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-64 md:pl-[368px] bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Upload to Knowledge Base</h2>
                                <p className="text-sm text-gray-500 mt-1">Share documents with workspace members.</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`p-3 text-sm font-medium rounded-xl border transition-all text-left ${
                                                category === cat 
                                                ? 'border-[#2eb781] bg-[#2eb781]/5 text-[#2eb781]' 
                                                : 'border-gray-200 text-gray-600 hover:border-[#2eb781]/50 hover:bg-gray-50'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">File</label>
                                {!selectedFile ? (
                                    <div 
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                            dragActive ? 'border-[#2eb781] bg-[#2eb781]/5' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => inputRef.current?.click()}
                                    >
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={handleChange}
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                                        />
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2eb781]">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PDF, Word, Excel, Text, or Images (max 50MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between bg-gray-50">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                                                <File className="w-5 h-5 text-[#2eb781]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatBytes(selectedFile.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isLoading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-[#2eb781] rounded-xl hover:bg-[#279e6f] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload File"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
