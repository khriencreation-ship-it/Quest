'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layout, Layers, Sliders, Type, FileImage, Clock,
    Search, GitMerge, FileText, Component, Lightbulb, UserCheck,
    RefreshCcw, MonitorSmartphone, Settings, Wrench, Focus, Accessibility,
    ChevronDown, ChevronUp, Plus, X, Check, Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UiUxConfig = {
    // 1. Project Type
    project_types: string[];
    custom_project_type: string;

    // 2. Design Phase Scope
    phases: {
        discovery: {
            included: boolean;
            activities: string[];
            deliverables: string[];
        };
        ia: {
            included: boolean;
            activities: string[];
            deliverables: string[];
        };
        wireframing: {
            low_fi: boolean;
            mid_fi: boolean;
            flow_validation: boolean;
            screen_count: string;
        };
        ui_design: {
            screen_cap_limit: number;
            responsive_desktop: boolean;
            responsive_tablet: boolean;
            responsive_mobile: boolean;
            dark_mode: boolean;
            animation_prototypes: boolean;
        };
    };

    // 3. Prototype Scope
    prototype: {
        included: boolean;
        clickable_demo: boolean;
        dev_ready_specs: boolean;
        animations: boolean;
        micro_interactions: boolean;
    };

    // 4. Design System
    design_system: {
        included: boolean;
        elements: string[];
        deliverables: string[];
    };

    // 5. Screen & Module Builder
    modules: string[];
    custom_modules: string[];

    // 6. Content Responsibility
    content: {
        ux_copy: string;
        microcopy: string;
    };

    // 7. Usability Testing
    testing: {
        method: string;
        feedback_rounds: number;
        participants_count: string;
    };

    // 8. Revisions
    revisions: {
        rounds_per_phase: number;
        what_counts: string;
        redesign_definition: string;
        post_approval_policy: string;
    };

    // 9. Developer Handoff
    handoff: {
        figma_dev_mode: boolean;
        style_guide_doc: boolean;
        asset_export: boolean;
        spacing_specs: boolean;
        api_interaction_doc: boolean;
    };

    // 10. Timeline Phasing
    timeline_phases: string[];

    // 11. Redesign Specifics
    redesign: {
        is_redesign: boolean;
        ux_audit: boolean;
        ui_refresh_only: boolean;
        full_restructuring: boolean;
        perf_improvements: boolean;
    };

    // 12. Accessibility
    accessibility: {
        wcag_required: boolean;
        testing_included: boolean;
        industry_compliance: string;
    };

    // 13. Post-Design Support
    support: {
        during_dev: boolean;
        design_qa: boolean;
        adjustments_count: string;
    };
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<UiUxConfig>;
    onClose: () => void;
};


// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_TYPES = ['Web Application', 'Mobile App (iOS / Android)', 'SaaS Platform', 'Admin Dashboard', 'Landing Page', 'Website', 'Internal Tool', 'Marketplace', 'CRM/ERP Interface', 'Redesign of Existing Product', 'MVP Prototype'];

const DISCOVERY_ACTIVITIES = ['Stakeholder interviews', 'User research', 'Competitor analysis', 'Market research', 'Product requirement review', 'User persona creation', 'Customer journey mapping'];
const DISCOVERY_DELIVERABLES = ['Research summary document', 'User persona profiles', 'UX strategy outline'];

const IA_ACTIVITIES = ['Sitemap creation', 'User flow diagrams', 'Feature mapping', 'Navigation structure'];
const IA_DELIVERABLES = ['Flow diagrams', 'IA documentation'];

const DS_ELEMENTS = ['Color system', 'Typography system', 'Button styles', 'Form components', 'Icon system', 'Spacing system', 'Layout grids', 'Design tokens'];
const DS_DELIVERABLES = ['Full design system file', 'Documentation'];

const APP_MODULES = [
    'Authentication (Login, Signup, Reset)', 'Dashboard', 'Profile Management', 'Settings',
    'Analytics', 'Messaging', 'E-commerce', 'Admin Panel', 'Notifications', 'Search', 'Booking Flow'
];

const CONTENT_RESPONSIBILITIES = ['Client provides', 'Khrien provides', 'Shared responsibility'];

const TESTING_METHODS = ['None', 'Internal testing only', 'External user testing', 'Prototype validation sessions'];

const TIMELINE_PHASES = ['Discovery (1–2 weeks)', 'IA & Wireframes', 'UI Design', 'Prototyping', 'Final Handoff'];

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-purple-600 cursor-pointer rounded shrink-0';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                        {icon}
                    </div>
                    <span className="font-semibold text-gray-900">{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {open && <div className="px-6 pb-6 pt-2 border-t border-gray-100">{children}</div>}
        </div>
    );
}

function MultiCheckbox({
    options, selected, onChange,
}: {
    options: string[];
    selected: string[];
    onChange: (val: string[]) => void;
}) {
    function toggle(opt: string) {
        onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
    }
    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {options.map(o => {
                const active = selected.includes(o);
                return (
                    <button
                        key={o}
                        type="button"
                        onClick={() => toggle(o)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        {active && <Check className="w-3 h-3" />}
                        {o}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UiUxScope({ serviceId, initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<UiUxConfig>({
        project_types: initialConfig.project_types || [],
        custom_project_type: initialConfig.custom_project_type || '',

        phases: {
            discovery: {
                included: true,
                activities: [],
                deliverables: [],
                ...(initialConfig.phases?.discovery || {})
            },
            ia: {
                included: true,
                activities: [],
                deliverables: [],
                ...(initialConfig.phases?.ia || {})
            },
            wireframing: {
                low_fi: true,
                mid_fi: true,
                flow_validation: true,
                screen_count: '',
                ...(initialConfig.phases?.wireframing || {})
            },
            ui_design: {
                screen_cap_limit: 20,
                responsive_desktop: true,
                responsive_tablet: false,
                responsive_mobile: true,
                dark_mode: false,
                animation_prototypes: false,
                ...(initialConfig.phases?.ui_design || {})
            }
        },

        prototype: {
            included: true,
            clickable_demo: true,
            dev_ready_specs: true,
            animations: false,
            micro_interactions: false,
            ...(initialConfig.prototype || {})
        },

        design_system: {
            included: false,
            elements: [],
            deliverables: [],
            ...(initialConfig.design_system || {})
        },

        modules: initialConfig.modules || [],
        custom_modules: initialConfig.custom_modules || [],

        content: {
            ux_copy: CONTENT_RESPONSIBILITIES[0],
            microcopy: CONTENT_RESPONSIBILITIES[0],
            ...(initialConfig.content || {})
        },

        testing: {
            method: TESTING_METHODS[0],
            feedback_rounds: 1,
            participants_count: '',
            ...(initialConfig.testing || {})
        },

        revisions: {
            rounds_per_phase: 2,
            what_counts: 'Minor layout tweaks, color adjustments, text changes.',
            redesign_definition: 'Complete user flow alteration or core structural change.',
            post_approval_policy: 'Billed hourly as a Change Request.',
            ...(initialConfig.revisions || {})
        },

        handoff: {
            figma_dev_mode: true,
            style_guide_doc: true,
            asset_export: true,
            spacing_specs: true,
            api_interaction_doc: false,
            ...(initialConfig.handoff || {})
        },

        timeline_phases: initialConfig.timeline_phases || TIMELINE_PHASES,

        redesign: {
            is_redesign: false,
            ux_audit: false,
            ui_refresh_only: false,
            full_restructuring: false,
            perf_improvements: false,
            ...(initialConfig.redesign || {})
        },

        accessibility: {
            wcag_required: false,
            testing_included: false,
            industry_compliance: '',
            ...(initialConfig.accessibility || {})
        },

        support: {
            during_dev: true,
            design_qa: true,
            adjustments_count: 'Up to 5 minor tweaks',
            ...(initialConfig.support || {})
        }
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [customModInput, setCustomModInput] = useState('');

    // helpers
    function setTop<K extends keyof UiUxConfig>(key: K, val: UiUxConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    function setSub<K extends keyof UiUxConfig>(section: K, key: string, val: any) {
        setConfig(c => ({
            ...c,
            [section]: { ...(c[section] as any), [key]: val }
        }));
        setSaved(false);
    }

    function setPhase<K extends keyof UiUxConfig['phases']>(phase: K, key: string, val: any) {
        setConfig(c => ({
            ...c,
            phases: {
                ...c.phases,
                [phase]: { ...c.phases[phase], [key]: val }
            }
        }));
        setSaved(false);
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        const result = await onSave(config);
        if (result.error) {
            setError(result.error);
        } else {
            setSaved(true);
            router.refresh();
        }
        setSaving(false);
    }

    return (
        <div className="space-y-4">

            {/* ── 1. Project Type ── */}
            <SectionCard title="1. Project Type Configuration" icon={<MonitorSmartphone className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mb-3">Define what is being designed.</p>
                <MultiCheckbox options={PROJECT_TYPES} selected={config.project_types} onChange={v => setTop('project_types', v)} />
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Custom Project Type</label>
                    <input type="text" value={config.custom_project_type} onChange={e => setTop('custom_project_type', e.target.value)} placeholder="e.g. Smart Watch App Interface" className={inputCls} />
                </div>
            </SectionCard>

            {/* ── 2. Design Phase Scope ── */}
            <SectionCard title="2. Design Phase Scope" icon={<Layers className="w-4 h-4" />}>
                <div className="space-y-6">

                    {/* A. Discovery */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">A. Discovery & Research Phase</h4>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
                                <input type="checkbox" checked={config.phases.discovery.included} onChange={e => setPhase('discovery', 'included', e.target.checked)} className={`${checkCls} !w-3 !h-3`} />
                                <span className="text-xs font-bold text-gray-700">INCL.</span>
                            </label>
                        </div>
                        {config.phases.discovery.included && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Activities</label>
                                    <MultiCheckbox options={DISCOVERY_ACTIVITIES} selected={config.phases.discovery.activities} onChange={v => setPhase('discovery', 'activities', v)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Deliverables</label>
                                    <MultiCheckbox options={DISCOVERY_DELIVERABLES} selected={config.phases.discovery.deliverables} onChange={v => setPhase('discovery', 'deliverables', v)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* B. IA */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">B. Information Architecture (IA)</h4>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
                                <input type="checkbox" checked={config.phases.ia.included} onChange={e => setPhase('ia', 'included', e.target.checked)} className={`${checkCls} !w-3 !h-3`} />
                                <span className="text-xs font-bold text-gray-700">INCL.</span>
                            </label>
                        </div>
                        {config.phases.ia.included && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Activities</label>
                                    <MultiCheckbox options={IA_ACTIVITIES} selected={config.phases.ia.activities} onChange={v => setPhase('ia', 'activities', v)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Deliverables</label>
                                    <MultiCheckbox options={IA_DELIVERABLES} selected={config.phases.ia.deliverables} onChange={v => setPhase('ia', 'deliverables', v)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* C. Wireframing */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">C. Wireframing</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.wireframing.low_fi} onChange={e => setPhase('wireframing', 'low_fi', e.target.checked)} className={checkCls} /> Low-fidelity wireframes
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.wireframing.mid_fi} onChange={e => setPhase('wireframing', 'mid_fi', e.target.checked)} className={checkCls} /> Mid-fidelity wireframes
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.wireframing.flow_validation} onChange={e => setPhase('wireframing', 'flow_validation', e.target.checked)} className={checkCls} /> User flow validation
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Est. Number of Screens</label>
                                <input type="text" value={config.phases.wireframing.screen_count} onChange={e => setPhase('wireframing', 'screen_count', e.target.value)} placeholder="e.g. 15-20 screens" className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* D. High-Fidelity UI */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">D. High-Fidelity UI Design</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Screen Cap Limit (Max screens allowed)</label>
                                <input type="number" min="1" value={config.phases.ui_design.screen_cap_limit} onChange={e => setPhase('ui_design', 'screen_cap_limit', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.ui_design.responsive_desktop} onChange={e => setPhase('ui_design', 'responsive_desktop', e.target.checked)} className={checkCls} /> Desktop Responsive
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.ui_design.responsive_tablet} onChange={e => setPhase('ui_design', 'responsive_tablet', e.target.checked)} className={checkCls} /> Tablet Responsive
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.ui_design.responsive_mobile} onChange={e => setPhase('ui_design', 'responsive_mobile', e.target.checked)} className={checkCls} /> Mobile Responsive
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.phases.ui_design.dark_mode} onChange={e => setPhase('ui_design', 'dark_mode', e.target.checked)} className={checkCls} /> Dark Mode Design
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer sm:col-span-2">
                                    <input type="checkbox" checked={config.phases.ui_design.animation_prototypes} onChange={e => setPhase('ui_design', 'animation_prototypes', e.target.checked)} className={checkCls} /> Advanced Animation Prototypes
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
            </SectionCard>

            {/* ── 3. Prototype Scope ── */}
            <SectionCard title="3. Prototype Scope" icon={<Layout className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 sm:col-span-2">
                        <input type="checkbox" checked={config.prototype.included} onChange={e => setSub('prototype', 'included', e.target.checked)} className={checkCls} />
                        Interactive Prototype Included
                    </label>

                    {config.prototype.included && (
                        <>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <input type="checkbox" checked={config.prototype.clickable_demo} onChange={e => setSub('prototype', 'clickable_demo', e.target.checked)} className={checkCls} /> Clickable Demo
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <input type="checkbox" checked={config.prototype.dev_ready_specs} onChange={e => setSub('prototype', 'dev_ready_specs', e.target.checked)} className={checkCls} /> Developer-ready specs
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <input type="checkbox" checked={config.prototype.animations} onChange={e => setSub('prototype', 'animations', e.target.checked)} className={checkCls} /> Animation Transitions
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <input type="checkbox" checked={config.prototype.micro_interactions} onChange={e => setSub('prototype', 'micro_interactions', e.target.checked)} className={checkCls} /> Micro-interactions
                            </label>
                        </>
                    )}
                </div>
            </SectionCard>

            {/* ── 4. Design System ── */}
            <SectionCard title="4. Design System Scope" icon={<Component className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <input type="checkbox" checked={config.design_system.included} onChange={e => setSub('design_system', 'included', e.target.checked)} className={checkCls} />
                        Include Comprehensive Design System
                    </label>

                    {config.design_system.included && (
                        <div className="pl-2 space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Elements to systematize</label>
                                <MultiCheckbox options={DS_ELEMENTS} selected={config.design_system.elements} onChange={v => setSub('design_system', 'elements', v)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Deliverables</label>
                                <MultiCheckbox options={DS_DELIVERABLES} selected={config.design_system.deliverables} onChange={v => setSub('design_system', 'deliverables', v)} />
                            </div>
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* ── 5. Screen & Module Builder ── */}
            <SectionCard title="5. Screen & Module Builder" icon={<Layers className="w-4 h-4" />} defaultOpen={false}>
                <p className="text-sm text-gray-500 mb-3">Select the core feature modules to be designed.</p>
                <MultiCheckbox options={APP_MODULES} selected={config.modules} onChange={v => setTop('modules', v)} />

                <div className="mt-6 border-t border-gray-100 pt-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Custom Modules</label>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="text"
                            value={customModInput}
                            onChange={e => setCustomModInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && customModInput.trim()) {
                                    e.preventDefault();
                                    setTop('custom_modules', [...config.custom_modules, customModInput.trim()]);
                                    setCustomModInput('');
                                }
                            }}
                            placeholder="Add a custom module flow..."
                            className={inputCls}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (customModInput.trim()) {
                                    setTop('custom_modules', [...config.custom_modules, customModInput.trim()]);
                                    setCustomModInput('');
                                }
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors shrink-0"
                        >
                            Add
                        </button>
                    </div>

                    {config.custom_modules.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {config.custom_modules.map((cm, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {cm}
                                    <button type="button" onClick={() => setTop('custom_modules', config.custom_modules.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* ── 6. Content Responsibility ── */}
            <SectionCard title="6. Content Responsibility" icon={<FileText className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">UX Copy (Headings, Body text)</label>
                        <select value={config.content.ux_copy} onChange={e => setSub('content', 'ux_copy', e.target.value)} className={inputCls}>
                            {CONTENT_RESPONSIBILITIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Microcopy & Error Msgs</label>
                        <select value={config.content.microcopy} onChange={e => setSub('content', 'microcopy', e.target.value)} className={inputCls}>
                            {CONTENT_RESPONSIBILITIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </SectionCard>

            {/* ── 7. Usability Testing ── */}
            <SectionCard title="7. Usability Testing Scope" icon={<UserCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Testing Method</label>
                        <select value={config.testing.method} onChange={e => setSub('testing', 'method', e.target.value)} className={inputCls}>
                            {TESTING_METHODS.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                {config.testing.method !== 'None' && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Feedback Iteration Rounds</label>
                            <input type="number" min="0" value={config.testing.feedback_rounds} onChange={e => setSub('testing', 'feedback_rounds', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Est. Participants (Optional)</label>
                            <input type="text" value={config.testing.participants_count} onChange={e => setSub('testing', 'participants_count', e.target.value)} placeholder="e.g. 5 users" className={inputCls} />
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── 8. Revisions ── */}
            <SectionCard title="8. Revision Structure" icon={<RefreshCcw className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">No. of Revision Rounds (Per Phase)</label>
                        <input type="number" min="0" value={config.revisions.rounds_per_phase} onChange={e => setSub('revisions', 'rounds_per_phase', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">What is a revision?</label>
                            <textarea rows={2} value={config.revisions.what_counts} onChange={e => setSub('revisions', 'what_counts', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">What is a redesign (billed extra)?</label>
                            <textarea rows={2} value={config.revisions.redesign_definition} onChange={e => setSub('revisions', 'redesign_definition', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Post-approval Change Policy</label>
                        <input type="text" value={config.revisions.post_approval_policy} onChange={e => setSub('revisions', 'post_approval_policy', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </SectionCard>

            {/* ── 9. Developer Handoff ── */}
            <SectionCard title="9. Developer Handoff Scope" icon={<GitMerge className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.handoff.figma_dev_mode} onChange={e => setSub('handoff', 'figma_dev_mode', e.target.checked)} className={checkCls} /> Figma Dev Mode Access
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.handoff.style_guide_doc} onChange={e => setSub('handoff', 'style_guide_doc', e.target.checked)} className={checkCls} /> Style Guide Documentation
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.handoff.asset_export} onChange={e => setSub('handoff', 'asset_export', e.target.checked)} className={checkCls} /> Asset Export (SVG, PNG, etc)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.handoff.spacing_specs} onChange={e => setSub('handoff', 'spacing_specs', e.target.checked)} className={checkCls} /> Spacing & Measurement Specs
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.handoff.api_interaction_doc} onChange={e => setSub('handoff', 'api_interaction_doc', e.target.checked)} className={checkCls} /> API Interaction Context Doc.
                    </label>
                </div>
            </SectionCard>

            {/* ── 10. Timeline ── */}
            <SectionCard title="10. Timeline Phasing" icon={<Clock className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={TIMELINE_PHASES} selected={config.timeline_phases} onChange={v => setTop('timeline_phases', v)} />
                <p className="text-xs text-gray-400 mt-2">Specific phase durations and checkpoints will be defined in the project.</p>
            </SectionCard>

            {/* ── 11. Redesign Specifics ── */}
            <SectionCard title="11. Redesign Specifics (If Applicable)" icon={<RefreshCcw className="w-4 h-4" />} defaultOpen={false}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                    <input type="checkbox" checked={config.redesign.is_redesign} onChange={e => setSub('redesign', 'is_redesign', e.target.checked)} className={checkCls} />
                    This service includes redesigning existing products
                </label>
                {config.redesign.is_redesign && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 border-l-2 border-gray-200 ml-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.redesign.ux_audit} onChange={e => setSub('redesign', 'ux_audit', e.target.checked)} className={checkCls} /> UX Audit Included
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.redesign.ui_refresh_only} onChange={e => setSub('redesign', 'ui_refresh_only', e.target.checked)} className={checkCls} /> UI Refresh Only
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.redesign.full_restructuring} onChange={e => setSub('redesign', 'full_restructuring', e.target.checked)} className={checkCls} /> Full UX Restructuring
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.redesign.perf_improvements} onChange={e => setSub('redesign', 'perf_improvements', e.target.checked)} className={checkCls} /> Performance/Flow Focus
                        </label>
                    </div>
                )}
            </SectionCard>

            {/* ── 12. Accessibility ── */}
            <SectionCard title="12. Accessibility & Compliance" icon={<Accessibility className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <input type="checkbox" checked={config.accessibility.wcag_required} onChange={e => setSub('accessibility', 'wcag_required', e.target.checked)} className={checkCls} />
                        WCAG Compliance Required
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <input type="checkbox" checked={config.accessibility.testing_included} onChange={e => setSub('accessibility', 'testing_included', e.target.checked)} className={checkCls} />
                        Accessibility testing included
                    </label>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Industry-specific compliance (fintech, health, etc)</label>
                        <input type="text" value={config.accessibility.industry_compliance} onChange={e => setSub('accessibility', 'industry_compliance', e.target.value)} placeholder="e.g. HIPAA compliant UI patterns" className={inputCls} />
                    </div>
                </div>
            </SectionCard>

            {/* ── 13. Post-Design Support ── */}
            <SectionCard title="13. Post-Design Support" icon={<Wrench className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.support.during_dev} onChange={e => setSub('support', 'during_dev', e.target.checked)} className={checkCls} /> Support during development
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.support.design_qa} onChange={e => setSub('support', 'design_qa', e.target.checked)} className={checkCls} /> Design QA during build phase
                        </label>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Number of adjustments allowed during Dev</label>
                        <input type="text" value={config.support.adjustments_count} onChange={e => setSub('support', 'adjustments_count', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </SectionCard>

            {/* ── Save Bar ── */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 flex items-center justify-between z-10">
                {error && <p className="text-sm text-red-600">{error}</p>}
                {saved && !error && (
                    <span className="flex items-center gap-2 text-sm text-emerald-700">
                        <Check className="w-4 h-4" /> Scope saved
                    </span>
                )}
                {!error && !saved && <span />}
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
