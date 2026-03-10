'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteProject } from '@/app/actions/projects';

type Props = {
    projectId: string;
    projectName: string;
};

export default function DeleteProjectButton({ projectId, projectName }: Props) {
    const router = useRouter();
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        const result = await deleteProject(projectId);

        if (result.error) {
            alert(`Failed to delete project: ${result.error}`);
            setIsDeleting(false);
            setIsConfirming(false);
        } else {
            router.refresh();
        }
    }

    if (isConfirming) {
        return (
            <div
                className="absolute inset-x-0 bottom-0 bg-white border-t border-red-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-2xl z-10 flex flex-col gap-3 animate-in slide-in-from-bottom-2"
                onClick={(e) => e.preventDefault()} // Prevent clicking through to the project link
            >
                <div className="flex items-start gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm">Delete {projectName}?</p>
                        <p className="text-xs text-red-500/80 leading-tight mt-0.5">This action cannot be undone. All tasks, documents, and history will be lost.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsConfirming(false);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, delete'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                setIsConfirming(true);
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
            title="Delete Project"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
