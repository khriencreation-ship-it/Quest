'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, FileText } from 'lucide-react';
import { updateOrgDocumentName } from '@/app/actions/org_documents';

type EditOrgDocumentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    currentName: string;
};

export default function EditOrgDocumentModal({
    isOpen,
    onClose,
    documentId,
    currentName,
}: EditOrgDocumentModalProps) {
    const router = useRouter();
    const [newName, setNewName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || newName === currentName) {
            onClose();
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await updateOrgDocumentName(documentId, newName.trim());

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setIsLoading(false);
            router.refresh();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Rename Document</h2>
                        <p className="text-sm text-gray-500 mt-1">Change the display name for the Knowledge Base.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            Document Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                autoFocus
                            />
                            <FileText className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newName.trim()}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-[#2eb781] hover:bg-[#279e6f] rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
