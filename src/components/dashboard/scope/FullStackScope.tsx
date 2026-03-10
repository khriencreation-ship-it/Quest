'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Code2, Box, Database, Sparkles, Paintbrush, Webhook,
    Server, ShieldCheck, TestTube, Clock, Wrench, FileEdit,
    ChevronDown, ChevronUp, Plus, X, Check, Loader2, Link as LinkIcon, RefreshCcw, Layers
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FullStackConfig = {
    // 1. Overview
    product_type: string;
    complexity_level: string;

    // 2. Architecture
    frontend: {
        included: boolean;
        platforms: string[];
        pages_count: string;
        design_handoff: boolean;
        documentation: boolean;
        pwa: boolean;
    };
    backend: {
        included: boolean;
        api_type: string[];
        features: string[];
        core_modules: string;
    };
    database: {
        type: string;
        schema_design: boolean;
        data_migration: boolean;
        backup_setup: boolean;
        encryption: boolean;
    };

    // 3. Features
    features: string[];
    custom_features: string[];

    // 4. UI/UX
    ui_ux: {
        provided_by_khrien: boolean;
        client_provides_design: boolean;
        wireframes: boolean;
        prototyping: boolean;
        design_system: boolean;
    };

    // 5. Integrations
    integrations: {
        types: string[];
        limit: string;
        custom_required: boolean;
    };

    // 6. DevOps
    devops: {
        hosting_included: boolean;
        provider: string;
        ci_cd: boolean;
        environments: string[];
        domain_ssl: boolean;
        performance_opt: boolean;
    };

    // 7. Security
    security: {
        auth_level: string;
        role_based: boolean;
        gdpr: boolean;
        vulnerability_testing: boolean;
    };

    // 8. Testing
    testing: {
        types: string[];
        bug_fix_window: string;
    };

    // 9. Timeline (Simplified list of phases)
    timeline_phases: string[];

    // 10. Maintenance
    maintenance: {
        support_period: string;
        bug_fixes: boolean;
        feature_additions: string;
        server_monitoring: boolean;
        update_frequency: string;
    };

    // 11. Revisions
    revisions: {
        rounds: number;
        qualifies_as_change: string;
    };
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<FullStackConfig>;
    onClose: () => void;
};


// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPES = ['Web Application', 'Mobile Application', 'SaaS Platform', 'Internal Company Tool', 'Marketplace', 'CRM System', 'ERP System', 'Custom Software'];
const COMPLEXITY_LEVELS = ['MVP (Minimum Viable Product)', 'Phase 1 Launch', 'Full System Build', 'Enterprise System'];

const FE_PLATFORMS = ['Web Frontend (React / Vue / Next)', 'Mobile App (iOS / Android / Cross-platform)', 'Admin Dashboard', 'Client Portal'];
const BE_API_TYPES = ['REST API', 'GraphQL API'];
const BE_FEATURES = ['Authentication system', 'Role-based access control', 'Payment processing', 'Notifications (Email/SMS/Push)', 'File storage', 'Reporting system'];

const DB_TYPES = ['SQL (MySQL / PostgreSQL)', 'NoSQL (MongoDB)', 'Hybrid'];

const CORE_MODULES = [
    'User Authentication', 'Dashboard', 'Analytics', 'Payment Module', 'Messaging System',
    'Admin Management', 'Reporting System', 'Notification System', 'Search & Filtering',
    'Booking System', 'E-commerce Module', 'API Integrations'
];

const INTEGRATION_TYPES = ['Payment gateway', 'Email services', 'SMS services', 'Cloud storage', 'CRM integration', 'Analytics integration', 'Social login', 'External APIs'];

const CLOUD_PROVIDERS = ['AWS', 'DigitalOcean', 'Azure', 'Vercel', 'Koyeb', 'Railway', 'Client hosting'];
const ENVIRONMENTS = ['Staging environment', 'Production deployment'];

const TESTING_TYPES = ['Unit testing', 'Integration testing', 'Manual QA', 'Automated testing', 'UAT (User Acceptance Testing)'];
const TIMELINE_PHASES = ['Discovery Phase', 'Design Phase', 'Development Phase', 'Testing Phase', 'Deployment Phase'];

const BUG_FIX_WINDOWS = ['14 days', '30 days', '60 days', '90 days', 'No bug fix window'];
const SUPPORT_PERIODS = ['None', '30 days', '60 days', '90 days', '6 months', '1 Year'];
const FEATURE_ADDITIONS = ['No', 'Limited (Minor tweaks)', 'Separate billing (Change Request)'];
const UPDATE_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Ad-hoc'];

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-blue-600 cursor-pointer rounded shrink-0';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
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
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
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

export default function FullStackScope({ serviceId, initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<FullStackConfig>({
        product_type: initialConfig.product_type || PRODUCT_TYPES[0],
        complexity_level: initialConfig.complexity_level || COMPLEXITY_LEVELS[2],

        frontend: {
            included: true,
            platforms: [],
            pages_count: '',
            design_handoff: true,
            documentation: true,
            pwa: false,
            ...(initialConfig.frontend || {})
        },
        backend: {
            included: true,
            api_type: ['REST API'],
            features: [],
            core_modules: '',
            ...(initialConfig.backend || {})
        },
        database: {
            type: DB_TYPES[0],
            schema_design: true,
            data_migration: false,
            backup_setup: true,
            encryption: true,
            ...(initialConfig.database || {})
        },

        features: initialConfig.features || [],
        custom_features: initialConfig.custom_features || [],

        ui_ux: {
            provided_by_khrien: true,
            client_provides_design: false,
            wireframes: true,
            prototyping: true,
            design_system: false,
            ...(initialConfig.ui_ux || {})
        },

        integrations: {
            types: [],
            limit: 'Unlimited',
            custom_required: false,
            ...(initialConfig.integrations || {})
        },

        devops: {
            hosting_included: true,
            provider: CLOUD_PROVIDERS[0],
            ci_cd: true,
            environments: ENVIRONMENTS,
            domain_ssl: true,
            performance_opt: true,
            ...(initialConfig.devops || {})
        },

        security: {
            auth_level: 'JWT / OAuth 2.0',
            role_based: true,
            gdpr: false,
            vulnerability_testing: false,
            ...(initialConfig.security || {})
        },

        testing: {
            types: ['Manual QA'],
            bug_fix_window: BUG_FIX_WINDOWS[1], // 30 days
            ...(initialConfig.testing || {})
        },

        timeline_phases: initialConfig.timeline_phases || TIMELINE_PHASES,

        maintenance: {
            support_period: SUPPORT_PERIODS[1], // 30 days
            bug_fixes: true,
            feature_additions: FEATURE_ADDITIONS[2], // Separate billing
            server_monitoring: false,
            update_frequency: UPDATE_FREQUENCIES[3], // Ad-hoc
            ...(initialConfig.maintenance || {})
        },

        revisions: {
            rounds: 2,
            qualifies_as_change: 'Any request altering approved wireframes or core DB schema.',
            ...(initialConfig.revisions || {})
        }
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [customFeatInput, setCustomFeatInput] = useState('');

    // helpers
    function setTop<K extends keyof FullStackConfig>(key: K, val: FullStackConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    function setSub<K extends keyof FullStackConfig>(section: K, key: string, val: any) {
        setConfig(c => ({
            ...c,
            [section]: { ...(c[section] as any), [key]: val }
        }));
        setSaved(false);
    }

    // ── Save ──────────────────────────────────────────────────────────────────
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

            {/* ── 1. Overview ── */}
            <SectionCard title="1. Project Overview" icon={<Box className="w-4 h-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Product Type</label>
                        <select
                            value={config.product_type}
                            onChange={e => setTop('product_type', e.target.value)}
                            className={inputCls}
                        >
                            {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Complexity Level</label>
                        <select
                            value={config.complexity_level}
                            onChange={e => setTop('complexity_level', e.target.value)}
                            className={inputCls}
                        >
                            {COMPLEXITY_LEVELS.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </SectionCard>

            {/* ── 2. Architecture ── */}
            <SectionCard title="2. Architecture Scope" icon={<Code2 className="w-4 h-4" />}>
                <div className="space-y-6">

                    {/* A. Frontend */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">A. Frontend Development</h4>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={config.frontend.included}
                                    onChange={e => setSub('frontend', 'included', e.target.checked)}
                                    className={`${checkCls} !w-3 !h-3`}
                                />
                                <span className="text-xs font-bold text-gray-700">INCL.</span>
                            </label>
                        </div>
                        {config.frontend.included && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Platforms</label>
                                    <MultiCheckbox options={FE_PLATFORMS} selected={config.frontend.platforms} onChange={v => setSub('frontend', 'platforms', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={config.frontend.pwa} onChange={e => setSub('frontend', 'pwa', e.target.checked)} className={checkCls} /> PWA (Progressive Web App)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={config.frontend.design_handoff} onChange={e => setSub('frontend', 'design_handoff', e.target.checked)} className={checkCls} /> Design Handoff Included
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={config.frontend.documentation} onChange={e => setSub('frontend', 'documentation', e.target.checked)} className={checkCls} /> FE Documentation
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Est. Number of Pages / Screens</label>
                                    <input type="text" value={config.frontend.pages_count} onChange={e => setSub('frontend', 'pages_count', e.target.value)} placeholder="e.g. 15-20 screens" className={inputCls} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* B. Backend */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">B. Backend Development</h4>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
                                <input
                                    type="checkbox"
                                    checked={config.backend.included}
                                    onChange={e => setSub('backend', 'included', e.target.checked)}
                                    className={`${checkCls} !w-3 !h-3`}
                                />
                                <span className="text-xs font-bold text-gray-700">INCL.</span>
                            </label>
                        </div>
                        {config.backend.included && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">API Type</label>
                                    <MultiCheckbox options={BE_API_TYPES} selected={config.backend.api_type} onChange={v => setSub('backend', 'api_type', v)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Backend Features</label>
                                    <MultiCheckbox options={BE_FEATURES} selected={config.backend.features} onChange={v => setSub('backend', 'features', v)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Core Modules & Endpoints details</label>
                                    <input type="text" value={config.backend.core_modules} onChange={e => setSub('backend', 'core_modules', e.target.value)} placeholder="e.g. 5 core modules, ~30 endpoints" className={inputCls} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* C. Database */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="mb-3 border-b border-gray-200 pb-3">
                            <h4 className="font-semibold text-gray-900">C. Database Setup</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Database Type</label>
                                <select value={config.database.type} onChange={e => setSub('database', 'type', e.target.value)} className={inputCls}>
                                    {DB_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={config.database.schema_design} onChange={e => setSub('database', 'schema_design', e.target.checked)} className={checkCls} /> Schema Design Incl.
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={config.database.data_migration} onChange={e => setSub('database', 'data_migration', e.target.checked)} className={checkCls} /> Data Migration Req.
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={config.database.backup_setup} onChange={e => setSub('database', 'backup_setup', e.target.checked)} className={checkCls} /> Backup Setup
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={config.database.encryption} onChange={e => setSub('database', 'encryption', e.target.checked)} className={checkCls} /> Security Encryption
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
            </SectionCard>

            {/* ── 3. Features ── */}
            <SectionCard title="3. Feature Scope Builder" icon={<Layers className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mb-3">Select the core feature modules to be developed.</p>
                <MultiCheckbox options={CORE_MODULES} selected={config.features} onChange={v => setTop('features', v)} />

                <div className="mt-6 border-t border-gray-100 pt-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Custom Modules</label>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="text"
                            value={customFeatInput}
                            onChange={e => setCustomFeatInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && customFeatInput.trim()) {
                                    e.preventDefault();
                                    setTop('custom_features', [...config.custom_features, customFeatInput.trim()]);
                                    setCustomFeatInput('');
                                }
                            }}
                            placeholder="Add a custom module..."
                            className={inputCls}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (customFeatInput.trim()) {
                                    setTop('custom_features', [...config.custom_features, customFeatInput.trim()]);
                                    setCustomFeatInput('');
                                }
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors shrink-0"
                        >
                            Add
                        </button>
                    </div>

                    {config.custom_features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {config.custom_features.map((cf, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {cf}
                                    <button type="button" onClick={() => setTop('custom_features', config.custom_features.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* ── 4. UI/UX ── */}
            <SectionCard title="4. UI/UX Integration" icon={<Paintbrush className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={config.ui_ux.provided_by_khrien} onChange={e => setSub('ui_ux', 'provided_by_khrien', e.target.checked)} className={`${checkCls} mt-0.5`} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">UI/UX provided by Khrien</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={config.ui_ux.client_provides_design} onChange={e => setSub('ui_ux', 'client_provides_design', e.target.checked)} className={`${checkCls} mt-0.5`} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Client provides design</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={config.ui_ux.wireframes} onChange={e => setSub('ui_ux', 'wireframes', e.target.checked)} className={`${checkCls} mt-0.5`} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Wireframes included</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={config.ui_ux.prototyping} onChange={e => setSub('ui_ux', 'prototyping', e.target.checked)} className={`${checkCls} mt-0.5`} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Prototyping included</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors sm:col-span-2">
                        <input type="checkbox" checked={config.ui_ux.design_system} onChange={e => setSub('ui_ux', 'design_system', e.target.checked)} className={`${checkCls} mt-0.5`} />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Design System included</p>
                        </div>
                    </label>
                </div>
            </SectionCard>

            {/* ── 5. Integrations ── */}
            <SectionCard title="5. Integrations & Ex. Services" icon={<LinkIcon className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={INTEGRATION_TYPES} selected={config.integrations.types} onChange={v => setSub('integrations', 'types', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Allowed Count</label>
                        <input type="text" value={config.integrations.limit} onChange={e => setSub('integrations', 'limit', e.target.value)} placeholder="e.g. 3 integrations" className={inputCls} />
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.integrations.custom_required} onChange={e => setSub('integrations', 'custom_required', e.target.checked)} className={checkCls} />
                            Custom integration development required
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* ── 6. DevOps ── */}
            <SectionCard title="6. DevOps & Deployment" icon={<Server className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <input type="checkbox" checked={config.devops.hosting_included} onChange={e => setSub('devops', 'hosting_included', e.target.checked)} className={checkCls} />
                        Hosting & Server Setup Included
                    </label>

                    {config.devops.hosting_included && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Cloud Provider</label>
                                <select value={config.devops.provider} onChange={e => setSub('devops', 'provider', e.target.value)} className={inputCls}>
                                    {CLOUD_PROVIDERS.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col justify-end pb-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.devops.ci_cd} onChange={e => setSub('devops', 'ci_cd', e.target.checked)} className={checkCls} /> CI/CD Automation Setup
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Environments</label>
                        <MultiCheckbox options={ENVIRONMENTS} selected={config.devops.environments} onChange={v => setSub('devops', 'environments', v)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.devops.domain_ssl} onChange={e => setSub('devops', 'domain_ssl', e.target.checked)} className={checkCls} /> Domain & SSL Config.
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.devops.performance_opt} onChange={e => setSub('devops', 'performance_opt', e.target.checked)} className={checkCls} /> Performance Optimization
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* ── 7. Security ── */}
            <SectionCard title="7. Security Scope" icon={<ShieldCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Auth Level / Encryption</label>
                        <input type="text" value={config.security.auth_level} onChange={e => setSub('security', 'auth_level', e.target.value)} placeholder="e.g. JWT / OAuth 2.0 / AES-256" className={inputCls} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.security.role_based} onChange={e => setSub('security', 'role_based', e.target.checked)} className={checkCls} /> Role-based permissions
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.security.gdpr} onChange={e => setSub('security', 'gdpr', e.target.checked)} className={checkCls} /> GDPR compliance
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.security.vulnerability_testing} onChange={e => setSub('security', 'vulnerability_testing', e.target.checked)} className={checkCls} /> Vulnerability testing
                    </label>
                </div>
            </SectionCard>

            {/* ── 8. Testing ── */}
            <SectionCard title="8. Testing Scope" icon={<TestTube className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={TESTING_TYPES} selected={config.testing.types} onChange={v => setSub('testing', 'types', v)} />
                <div className="mt-4 pt-4 border-t border-gray-100 w-1/2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Bug Fix Window</label>
                    <select value={config.testing.bug_fix_window} onChange={e => setSub('testing', 'bug_fix_window', e.target.value)} className={inputCls}>
                        {BUG_FIX_WINDOWS.map(w => <option key={w}>{w}</option>)}
                    </select>
                </div>
            </SectionCard>

            {/* ── 9. Timeline ── */}
            <SectionCard title="9. Timeline Phases" icon={<Clock className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={TIMELINE_PHASES} selected={config.timeline_phases} onChange={v => setTop('timeline_phases', v)} />
                <p className="text-xs text-gray-400 mt-2">Specific estimates and payment triggers will be set per-project.</p>
            </SectionCard>

            {/* ── 10. Maintenance ── */}
            <SectionCard title="10. Maintenance & Support" icon={<Wrench className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Support Period (Post-launch)</label>
                        <select value={config.maintenance.support_period} onChange={e => setSub('maintenance', 'support_period', e.target.value)} className={inputCls}>
                            {SUPPORT_PERIODS.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Feature Additions</label>
                        <select value={config.maintenance.feature_additions} onChange={e => setSub('maintenance', 'feature_additions', e.target.value)} className={inputCls}>
                            {FEATURE_ADDITIONS.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Update Frequency</label>
                        <select value={config.maintenance.update_frequency} onChange={e => setSub('maintenance', 'update_frequency', e.target.value)} className={inputCls}>
                            {UPDATE_FREQUENCIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.maintenance.bug_fixes} onChange={e => setSub('maintenance', 'bug_fixes', e.target.checked)} className={checkCls} /> Bug fixes included
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.maintenance.server_monitoring} onChange={e => setSub('maintenance', 'server_monitoring', e.target.checked)} className={checkCls} /> Server monitoring
                    </label>
                </div>
            </SectionCard>

            {/* ── 11. Revisions ── */}
            <SectionCard title="11. Revision & Change Control" icon={<RefreshCcw className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">No. of Revision Rounds</label>
                        <input type="number" min="0" value={config.revisions.rounds} onChange={e => setSub('revisions', 'rounds', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">What qualifies as a scope change?</label>
                        <textarea
                            rows={2}
                            value={config.revisions.qualifies_as_change}
                            onChange={e => setSub('revisions', 'qualifies_as_change', e.target.value)}
                            className={`${inputCls} resize-none`}
                        />
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
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
