'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Plus, Layout, Palette, Share2, Video, Globe, Code2, Layers } from 'lucide-react';
import { createService } from '@/app/actions/services';

type Props = {
    onClose: () => void;
    onCreated: (serviceType: string) => void;
};


const SERVICE_TYPES = [
    { id: 'social_media', label: 'Social Media Management', icon: <Share2 className="w-4 h-4" /> },
    { id: 'graphics_design', label: 'Graphics Design', icon: <Palette className="w-4 h-4" /> },
    { id: 'video_production', label: 'Video Production', icon: <Video className="w-4 h-4" /> },
    { id: 'ui_ux_design', label: 'UI/UX Design', icon: <Layout className="w-4 h-4" /> },
    { id: 'fullstack_dev', label: 'Full Stack Development', icon: <Code2 className="w-4 h-4" /> },
    { id: 'web_development', label: 'Website Development', icon: <Globe className="w-4 h-4" /> },
    { id: 'other', label: 'Other Service', icon: <Layers className="w-4 h-4" /> },
];

export default function CreateServiceModal({ onClose, onCreated }: Props) {

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await createService(formData);


        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            onCreated(formData.name);
            router.refresh();
            onClose();
        }

    }

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Service</h2>
                        <p className="text-sm text-gray-500">Define a new service for your company.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Service Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Premium Branding Package"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-gray-900"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Briefly describe what this service entails..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-gray-900 resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2eb781] text-white text-sm font-bold rounded-xl hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <><Plus className="w-5 h-5" /> Create Service</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
