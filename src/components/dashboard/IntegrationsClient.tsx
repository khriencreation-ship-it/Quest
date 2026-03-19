'use client';

import { useState } from 'react';
import { Calendar, Video, Check, Loader2, Link2, ExternalLink, X, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
    activeIntegrations: string[];
};

export default function IntegrationsClient({ activeIntegrations }: Props) {
    const router = useRouter();
    const [connecting, setConnecting] = useState<string | null>(null);
    const integrations = [
        {
            id: 'google',
            name: 'Google (Calendar + Meet)',
            description: 'Connect once to use Calendar and generate Meet links.',
            icon: Calendar,
            connected: activeIntegrations.includes('google'),
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            actionText: 'Connect Google'
        }
    ];

    const handleAction = () => {
        router.push('/dashboard/integrations/google');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-500 mt-1">Connect your workspace with your favorite tools and services.</p>
            </div>

            {/* Integrations List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {integrations.map((integration) => {
                        const Icon = integration.icon;
                        const isConnecting = connecting === integration.id;
                        const isMeet = integration.id === 'google-meet';

                        return (
                            <div key={integration.id} className="p-5 hover:bg-gray-50/50 transition-colors flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${integration.bgColor} ${integration.borderColor}`}>
                                        <Icon className={`w-6 h-6 ${integration.color}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 text-lg">{integration.name}</p>
                                            {integration.connected && !isMeet && (
                                                <span className="inline-flex items-center gap-1 w-fit rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    <Check className="w-3 h-3" /> Connected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                            {integration.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => handleAction()}
                                        disabled={isConnecting}
                                        className={`flex items-center justify-center min-w-[120px] gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 ${(integration.connected && !isMeet)
                                            ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                            : 'bg-[#2eb781] text-white hover:bg-[#279e6f]'
                                            }`}
                                    >
                                        {!isConnecting && (
                                            <>
                                                {isMeet ? <Video className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                                                {integration.connected ? 'Manage' : integration.actionText}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
