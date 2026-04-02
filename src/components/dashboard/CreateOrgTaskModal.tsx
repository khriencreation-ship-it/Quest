'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { createOrgTask } from '@/app/actions/org_tasks';
import { getCompanyStaff } from '@/app/actions/staff';

type StaffItem = {
    id: string;
    full_name: string;
    email: string;
};

type Props = {
    activeOrgId: string;
};

export default function CreateOrgTaskModal({ activeOrgId }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [staffLoading, setStaffLoading] = useState(true);

    const loadStaff = async () => {
        setStaffLoading(true);
        try {
            const staffData = await getCompanyStaff();
            setStaff(staffData);
        } catch (err) {
            console.error('Failed to load staff:', err);
            setError('Failed to load staff members');
        } finally {
            setStaffLoading(false);
        }
    };

    async function handleAction(formData: FormData) {
        setIsLoading(true);
        setError(null);

        // Add selected staff IDs and organization_id to form data
        selectedStaffIds.forEach(staffId => {
            formData.append('staff_ids', staffId);
        });
        formData.append('organization_id', activeOrgId);

        const result = await createOrgTask(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setIsOpen(false);
            setIsLoading(false);
            router.refresh();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => {
                    setIsOpen(true);
                    loadStaff();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl hover:bg-[#279e6f] font-medium transition-colors shadow-sm"
            >
                <Plus className="w-5 h-5" />
                New Task
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-64 md:pl-[368px] bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create Internal Task</h2>
                        <p className="text-sm text-gray-500 mt-1">Assign a task to team members within this workspace.</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form action={handleAction} className="p-6 space-y-5 overflow-y-auto">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Task Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="e.g. Review Q3 Marketing Deliverables"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                placeholder="Provide full details, instructions, or links..."
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all resize-none"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Due Date
                            </label>
                            <input
                                type="date"
                                name="due_date"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                            />
                        </div>

                        {/* Staff Assignment Section */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Assign To <span className="text-red-500">*</span>
                            </label>
                            {staffLoading ? (
                                <div className="flex h-[150px] items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-[#2eb781] animate-spin" />
                                </div>
                            ) : staff.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No staff members found in your company.</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {staff.map((member) => (
                                            <label key={member.id} className="flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all hover:bg-gray-50 border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStaffIds.includes(member.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStaffIds(prev => [...prev, member.id]);
                                                        } else {
                                                            setSelectedStaffIds(prev => prev.filter(id => id !== member.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-[#2eb781] border-gray-300 focus:ring-[#2eb781]"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                                                    <p className="text-[10px] text-gray-500">{member.email}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Select the team members responsible for completing this task.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 mt-auto">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || selectedStaffIds.length === 0}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-[#2eb781] hover:bg-[#279e6f] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
