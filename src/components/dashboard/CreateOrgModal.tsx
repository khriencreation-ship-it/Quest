'use client';

import { useState } from 'react';
import { Plus, X, Building, Loader2 } from 'lucide-react';
import { createOrganization } from '@/app/actions/organization';
import { useRouter } from 'next/navigation';

export default function CreateOrgModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError('');

        const result = await createOrganization(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            // Success
            setIsOpen(false);
            setIsLoading(false);
            router.refresh(); // Refresh the current route to fetch new orgs
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                New Organization
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2eb781]/10 flex items-center justify-center">
                                    <Building className="w-5 h-5 text-[#2eb781]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Add Organization</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Organization Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        placeholder="e.g. Marketing Dept, European Branch"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all bg-gray-50 focus:bg-white text-sm text-gray-900 placeholder-gray-400"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Description <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        placeholder="What is the purpose of this organization?"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all bg-gray-50 focus:bg-white text-sm text-gray-900 placeholder-gray-400 resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2eb781] text-white font-semibold hover:bg-[#279e6f] transition-all disabled:opacity-50 text-sm shadow-sm"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
