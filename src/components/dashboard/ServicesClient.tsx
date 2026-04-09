'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layers, Share2, Palette, Video, Layout, Code2, Globe,
    ToggleLeft, ToggleRight, Settings, ChevronRight, X, Sparkles,
    CheckCircle2, Circle, MoreVertical, Trash2
} from 'lucide-react';
import { toggleService, updateServiceScope, deleteService } from '@/app/actions/services';

import SocialMediaScope from './scope/SocialMediaScope';
import FullStackScope from './scope/FullStackScope';
import GraphicsDesignScope from './scope/GraphicsDesignScope';
import UiUxScope from './scope/UiUxScope';
import VideoProductionScope from './scope/VideoProductionScope';
import WebsiteDevScope from './scope/WebsiteDevelopmentScope';
import GenericScope from './scope/GenericScope';
import CreateServiceModal from './modals/CreateServiceModal';
import { useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Service = {
    id: string;
    name: string;
    description: string | null;
    service_type: string;
    scope_config: Record<string, any>;
    is_active: boolean;
    created_at: string;
};

type Props = { services: Service[] };

// ─── Service metadata (icon, colour, summary fn) ──────────────────────────────

const SERVICE_META: Record<string, {
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
}> = {
    social_media: {
        icon: <Share2 className="w-5 h-5" />,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-100',
    },
    graphics_design: {
        icon: <Palette className="w-5 h-5" />,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-100',
    },
    video_production: {
        icon: <Video className="w-5 h-5" />,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-100',
    },
    ui_ux_design: {
        icon: <Layout className="w-5 h-5" />,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
    },
    fullstack_dev: {
        icon: <Code2 className="w-5 h-5" />,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
    },
    web_development: {
        icon: <Globe className="w-5 h-5" />,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-teal-100',
    },
};

// ─── Scope Renderer ───────────────────────────────────────────────────────────

function ScopePanel({ service, onClose }: { service: Service; onClose: () => void }) {
    if (service.service_type === 'social_media') {
        return (
            <SocialMediaScope
                serviceId={service.id}
                initialConfig={service.scope_config as any}
                onClose={onClose}
                onSave={async (config: any) => updateServiceScope(service.id, config)}
            />
        );
    }

    if (service.service_type === 'fullstack_dev') {
        return (
            <FullStackScope
                serviceId={service.id}
                initialConfig={service.scope_config as any}
                onClose={onClose}
                onSave={async (config: any) => updateServiceScope(service.id, config)}
            />
        );
    }

    if (service.service_type === 'graphics_design') {
        return (
            <GraphicsDesignScope
                serviceId={service.id}
                initialConfig={service.scope_config as any}
                onClose={onClose}
                onSave={async (config: any) => updateServiceScope(service.id, config)}
            />
        );
    }

    if (service.service_type === 'ui_ux_design') {
        return (
            <UiUxScope
                serviceId={service.id}
                initialConfig={service.scope_config as any}
                onClose={onClose}
                onSave={async (config: any) => updateServiceScope(service.id, config)}
            />
        );
    }

    if (service.service_type === 'video_production') {
        return (
            <VideoProductionScope
                serviceId={service.id}
                initialConfig={service.scope_config as any}
                onClose={onClose}
                onSave={async (config: any) => updateServiceScope(service.id, config)}
            />
        );
    }

    if (service.service_type === 'web_development') {
        return (
            <WebsiteDevScope
                serviceId={service.id}
                initialConfig={service.scope_config as any}
                onClose={onClose}
                onSave={async (config: any) => updateServiceScope(service.id, config)}
            />
        );
    }

    return (
        <GenericScope
            serviceId={service.id}
            initialConfig={service.scope_config as any}
            onClose={onClose}
            onSave={async (config: any) => updateServiceScope(service.id, config)}
        />
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesClient({ services }: Props) {
    const router = useRouter();
    const [activeService, setActiveService] = useState<Service | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [pendingNewServiceType, setPendingNewServiceType] = useState<string | null>(null);

    // Auto-open logic: When services list updates after a creation, find the new service and open it
    useEffect(() => {
        if (pendingNewServiceType && services.length > 0) {
            // Find the most recently created service of that type
            const sorted = [...services].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const newest = sorted.find(s => s.service_type === pendingNewServiceType);

            if (newest) {
                setActiveService(newest);
                setPendingNewServiceType(null);
            }
        }
    }, [services, pendingNewServiceType]);

    async function handleToggle(svc: Service) {
        setTogglingId(svc.id);
        await toggleService(svc.id, !svc.is_active);
        router.refresh();
        setTogglingId(null);
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Services</h1>
                    <p className="text-gray-500 mt-1">
                        Manage the services ({services.length}) you offer and configure their project scope.
                    </p>
                </div>
                <div className="">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-sm font-semibold text-white px-4 py-2 bg-[#2eb781] rounded-xl border border-[#2eb781] hover:bg-[#279e6f] transition-all"
                    >
                        Add Service
                    </button>
                </div>
            </div>

            {showCreateModal && (
                <CreateServiceModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(serviceType) => {
                        setPendingNewServiceType(serviceType);
                        router.refresh();
                    }}
                />
            )}

            {/* Service Cards */}
            <div className="space-y-3">
                {services.map((svc) => {
                    const meta = SERVICE_META[svc.service_type] || {
                        icon: <Layers className="w-5 h-5" />,
                        color: 'text-gray-600',
                        bg: 'bg-gray-100',
                        border: 'border-gray-200',
                    };
                    const isToggling = togglingId === svc.id;

                    return (
                        <div
                            key={svc.id}
                            className={`bg-white border rounded-2xl shadow-sm transition-all ${svc.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
                        >
                            <div className="flex items-center gap-4 p-5">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border ${meta.color}`}>
                                    {meta.icon}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                                        {svc.is_active ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                                <Circle className="w-3 h-3" /> Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">{svc.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleToggle(svc)}
                                        disabled={isToggling}
                                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                                        title={svc.is_active ? 'Deactivate service' : 'Activate service'}
                                    >
                                        {svc.is_active
                                            ? <ToggleRight className="w-6 h-6 text-[#2eb781]" />
                                            : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                                    </button>

                                    {/* Configure */}
                                    <button
                                        onClick={() => setActiveService(svc)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Configure
                                    </button>

                                    {/* More Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActionMenuId(actionMenuId === svc.id ? null : svc.id)}
                                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {actionMenuId === svc.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 animate-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Are you sure you want to delete this service and all associated data?')) {
                                                                const res = await deleteService(svc.id);
                                                                if (!res.success) {
                                                                    alert(res.error);
                                                                }
                                                                setActionMenuId(null);
                                                                router.refresh();
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Service
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scope Slide-Over Panel */}
            {activeService && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setActiveService(null)} />

                    {/* Panel */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-200 shrink-0">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const meta = SERVICE_META[activeService.service_type];
                                    return meta ? (
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                                            {meta.icon}
                                        </div>
                                    ) : null;
                                })()}
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{activeService.name}</h2>
                                    <p className="text-xs text-gray-500">Scope Configuration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveService(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <ScopePanel service={activeService} onClose={() => setActiveService(null)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
