'use client';

import { useState } from 'react';
import { Loader2, Building, Sparkles, Check, AlertCircle } from 'lucide-react';
import { updateCompany } from '@/app/actions/company';

type Props = {
    company: {
        id: string;
        name: string;
        description: string | null;
    };
};

export default function CompanySettingsForm({ company }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [name, setName] = useState(company.name);
    const [description, setDescription] = useState(company.description || '');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        const result = await updateCompany(formData);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Company details updated successfully.' });
        }
        setIsLoading(false);
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#2eb781]/10 rounded-xl flex items-center justify-center text-[#2eb781]">
                        <Building className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Company Profile</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Edit your company identity and description.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 ${
                        message.type === 'error' 
                            ? 'bg-red-50 text-red-600 border-red-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Company Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900"
                            placeholder="e.g. Acme Industries"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Company Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900"
                            placeholder="Tell us a bit about what your company does..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2eb781] text-white font-bold hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
