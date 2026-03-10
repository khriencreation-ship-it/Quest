'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Palette, Layers, Sliders, Type, FileImage, Clock,
    RefreshCcw, CheckCircle, DownloadCloud, FileCheck,
    Printer, Repeat, ChevronDown, ChevronUp, Plus, X, Check, Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GraphicsDesignConfig = {
    // 1. Project Type
    categories: string[];
    custom_category: string;

    // 2. Deliverable Scope
    volume: {
        type: string;
        count: number;
    };
    specific_deliverables: {
        social_media: string[];
        brand_identity: string[];
    };

    // 3. Complexity
    complexity_level: string;

    // 4. Content Responsibility
    content: {
        copy_provider: string;
        image_provider: string[];
    };

    // 5. Brand Asset Setup
    assets_provided: {
        guidelines: boolean;
        logo: boolean;
        fonts: boolean;
        colors: boolean;
        previous_designs: boolean;
    };

    // 6. Turnaround Time
    turnaround: {
        standard_hours: number;
        express_available: boolean;
        delivery_mode: string;
    };

    // 7. Revision Policy
    revisions: {
        rounds: number;
        what_counts: string;
        redesign_definition: string;
    };

    // 8. Approval Workflow
    approval: {
        client_must_approve: boolean;
        deadline_hours: number;
        auto_approval: boolean;
    };

    // 9. File Delivery
    delivery: {
        formats: string[];
        method: string;
    };

    // 10. Usage Rights
    rights: {
        client_owns_final: boolean;
        editable_included: boolean;
        stock_transferable: boolean;
        portfolio_usage: boolean;
    };

    // 11. Print & Production
    print: {
        coordination: boolean;
        supervision: boolean;
        spec_setup: boolean;
        paper_selection: boolean;
    };

    // 12. Retainer Structure
    retainer: {
        is_ongoing: boolean;
        monthly_cap: number;
        rollover: boolean;
        priority_support: boolean;
        dedicated_designer: boolean;
    };
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<GraphicsDesignConfig>;
    onClose: () => void;
};


// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Social Media Designs', 'Brand Identity Design', 'Marketing Collateral', 'Print Design', 'Presentation Design', 'Packaging Design', 'Event Design', 'Website Graphics', 'Advertising Creatives'];

const VOLUME_TYPES = ['One-time batch', 'Per week', 'Per month', 'Ongoing retainer'];

const SOCIAL_DELIVERABLES = ['Static Posts', 'Carousel Posts (multi-slide)', 'Story Graphics', 'Ad Creatives', 'Thumbnails', 'Banners'];
const BRAND_DELIVERABLES = ['Logo Design', 'Logo Variations', 'Color Palette', 'Typography System', 'Brand Guidelines Document', 'Social Media Kit', 'Business Cards', 'Letterheads'];

const COMPLEXITY_LEVELS = [
    { id: 'Basic', desc: 'Template-based / Simple layout' },
    { id: 'Standard', desc: 'Custom design / moderate creativity' },
    { id: 'Premium', desc: 'High-concept / custom illustration / advanced layout' }
];

const COPY_PROVIDERS = ['Client provides final copy', 'Client provides rough copy (Khrien refines)', 'Khrien creates full content'];
const IMAGE_PROVIDERS = ['Client assets', 'Stock images', 'Custom illustrations', 'AI-generated assets'];

const DELIVERY_MODES = ['Batch delivery', 'Daily delivery'];

const DELIVERY_FORMATS = ['JPG', 'PNG', 'PDF', 'Editable source files (AI/PSD/Figma)', 'Social-ready export formats', 'Print-ready formats (CMYK)'];
const DELIVERY_METHODS = ['Google Drive', 'Dropbox', 'Direct Download / Email'];

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-orange-600 cursor-pointer rounded shrink-0';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
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
                            ? 'bg-orange-50 border-orange-200 text-orange-700'
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

export default function GraphicsDesignScope({ serviceId, initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<GraphicsDesignConfig>({
        categories: initialConfig.categories || [],
        custom_category: initialConfig.custom_category || '',

        volume: {
            type: VOLUME_TYPES[0],
            count: 1,
            ...(initialConfig.volume || {})
        },
        specific_deliverables: {
            social_media: [],
            brand_identity: [],
            ...(initialConfig.specific_deliverables || {})
        },

        complexity_level: initialConfig.complexity_level || COMPLEXITY_LEVELS[1].id,

        content: {
            copy_provider: COPY_PROVIDERS[0],
            image_provider: ['Client assets'],
            ...(initialConfig.content || {})
        },

        assets_provided: {
            guidelines: false,
            logo: false,
            fonts: false,
            colors: false,
            previous_designs: false,
            ...(initialConfig.assets_provided || {})
        },

        turnaround: {
            standard_hours: 48,
            express_available: false,
            delivery_mode: DELIVERY_MODES[0],
            ...(initialConfig.turnaround || {})
        },

        revisions: {
            rounds: 2,
            what_counts: 'Minor text edits, color swaps, image replacements.',
            redesign_definition: 'Complete layout change or fundamental concept shift.',
            ...(initialConfig.revisions || {})
        },

        approval: {
            client_must_approve: true,
            deadline_hours: 48,
            auto_approval: true,
            ...(initialConfig.approval || {})
        },

        delivery: {
            formats: ['JPG', 'PNG'],
            method: DELIVERY_METHODS[0],
            ...(initialConfig.delivery || {})
        },

        rights: {
            client_owns_final: true,
            editable_included: false,
            stock_transferable: false,
            portfolio_usage: true,
            ...(initialConfig.rights || {})
        },

        print: {
            coordination: false,
            supervision: false,
            spec_setup: true,
            paper_selection: false,
            ...(initialConfig.print || {})
        },

        retainer: {
            is_ongoing: false,
            monthly_cap: 10,
            rollover: false,
            priority_support: false,
            dedicated_designer: false,
            ...(initialConfig.retainer || {})
        }
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // helpers
    function setTop<K extends keyof GraphicsDesignConfig>(key: K, val: GraphicsDesignConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    function setSub<K extends keyof GraphicsDesignConfig>(section: K, key: string, val: any) {
        setConfig(c => ({
            ...c,
            [section]: { ...(c[section] as any), [key]: val }
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
            <SectionCard title="1. Category & Project Type" icon={<Palette className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mb-3">Select the categories of design needed.</p>
                <MultiCheckbox options={CATEGORIES} selected={config.categories} onChange={v => setTop('categories', v)} />
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Custom Category (Optional)</label>
                    <input type="text" value={config.custom_category} onChange={e => setTop('custom_category', e.target.value)} placeholder="e.g. Billboard & OOH Design" className={inputCls} />
                </div>
            </SectionCard>

            {/* ── 2. Deliverable Scope ── */}
            <SectionCard title="2. Deliverables Volume & Types" icon={<Layers className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-100">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Volume Type</label>
                        <select value={config.volume.type} onChange={e => setSub('volume', 'type', e.target.value)} className={inputCls}>
                            {VOLUME_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Number of Designs</label>
                        <input type="number" min="1" value={config.volume.count} onChange={e => setSub('volume', 'count', parseInt(e.target.value))} className={inputCls} />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Social Types */}
                    {config.categories.includes('Social Media Designs') && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Social Media Breakdown</h4>
                            <MultiCheckbox
                                options={SOCIAL_DELIVERABLES}
                                selected={config.specific_deliverables.social_media}
                                onChange={v => setConfig(c => ({
                                    ...c,
                                    specific_deliverables: { ...c.specific_deliverables, social_media: v }
                                }))}
                            />
                        </div>
                    )}
                    {/* Brand Types */}
                    {config.categories.includes('Brand Identity Design') && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Brand Identity Breakdown</h4>
                            <MultiCheckbox
                                options={BRAND_DELIVERABLES}
                                selected={config.specific_deliverables.brand_identity}
                                onChange={v => setConfig(c => ({
                                    ...c,
                                    specific_deliverables: { ...c.specific_deliverables, brand_identity: v }
                                }))}
                            />
                        </div>
                    )}
                    {!config.categories.includes('Social Media Designs') && !config.categories.includes('Brand Identity Design') && (
                        <p className="text-sm text-gray-400 italic">Select Social Media or Brand Identity above to see specific deliverable breakdowns.</p>
                    )}
                </div>
            </SectionCard>

            {/* ── 3. Complexity ── */}
            <SectionCard title="3. Complexity Level" icon={<Sliders className="w-4 h-4" />}>
                <div className="space-y-3">
                    {COMPLEXITY_LEVELS.map(c => (
                        <label key={c.id} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${config.complexity_level === c.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="complexity"
                                checked={config.complexity_level === c.id}
                                onChange={() => setTop('complexity_level', c.id)}
                                className="w-4 h-4 mt-0.5 accent-orange-600"
                            />
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{c.id}</p>
                                <p className="text-xs text-gray-500">{c.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </SectionCard>

            {/* ── 4. Content Responsibility ── */}
            <SectionCard title="4. Content Responsibility" icon={<Type className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Copy / Text Provider</label>
                        <select value={config.content.copy_provider} onChange={e => setSub('content', 'copy_provider', e.target.value)} className={inputCls}>
                            {COPY_PROVIDERS.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Image Sources</label>
                        <MultiCheckbox options={IMAGE_PROVIDERS} selected={config.content.image_provider} onChange={v => setSub('content', 'image_provider', v)} />
                    </div>
                </div>
            </SectionCard>

            {/* ── 5. Brand Assets ── */}
            <SectionCard title="5. Brand Asset Setup" icon={<FileImage className="w-4 h-4" />} defaultOpen={false}>
                <p className="text-sm text-gray-500 mb-3">Ensure the following assets are provided before starting.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.assets_provided.guidelines} onChange={e => setSub('assets_provided', 'guidelines', e.target.checked)} className={checkCls} /> Brand guidelines
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.assets_provided.logo} onChange={e => setSub('assets_provided', 'logo', e.target.checked)} className={checkCls} /> Logo files
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.assets_provided.fonts} onChange={e => setSub('assets_provided', 'fonts', e.target.checked)} className={checkCls} /> Fonts provided
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.assets_provided.colors} onChange={e => setSub('assets_provided', 'colors', e.target.checked)} className={checkCls} /> Color codes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.assets_provided.previous_designs} onChange={e => setSub('assets_provided', 'previous_designs', e.target.checked)} className={checkCls} /> Previous designs
                    </label>
                </div>
            </SectionCard>

            {/* ── 6. Turnaround ── */}
            <SectionCard title="6. Turnaround Time" icon={<Clock className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Standard T/A (Hours)</label>
                        <input type="number" min="1" value={config.turnaround.standard_hours} onChange={e => setSub('turnaround', 'standard_hours', parseInt(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Delivery Mode</label>
                        <select value={config.turnaround.delivery_mode} onChange={e => setSub('turnaround', 'delivery_mode', e.target.value)} className={inputCls}>
                            {DELIVERY_MODES.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.turnaround.express_available} onChange={e => setSub('turnaround', 'express_available', e.target.checked)} className={checkCls} />
                            Express delivery available
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* ── 7. Revisions ── */}
            <SectionCard title="7. Revision Policy" icon={<RefreshCcw className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Included Revision Rounds</label>
                        <input type="number" min="0" value={config.revisions.rounds} onChange={e => setSub('revisions', 'rounds', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">What is a revision?</label>
                            <textarea rows={2} value={config.revisions.what_counts} onChange={e => setSub('revisions', 'what_counts', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">What is a redesign (billed extra)?</label>
                            <textarea rows={2} value={config.revisions.redesign_definition} onChange={e => setSub('revisions', 'redesign_definition', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 8. Approval ── */}
            <SectionCard title="8. Approval Workflow" icon={<CheckCircle className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Approval Deadline (Hours)</label>
                        <input type="number" min="1" value={config.approval.deadline_hours} onChange={e => setSub('approval', 'deadline_hours', parseInt(e.target.value))} className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-2 justify-center pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.approval.client_must_approve} onChange={e => setSub('approval', 'client_must_approve', e.target.checked)} className={checkCls} /> Client must approve before export
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.approval.auto_approval} onChange={e => setSub('approval', 'auto_approval', e.target.checked)} className={checkCls} /> Auto-approve if deadline missed
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* ── 9. Delivery ── */}
            <SectionCard title="9. File Delivery Structure" icon={<DownloadCloud className="w-4 h-4" />} defaultOpen={false}>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Final Deliverable Formats</label>
                    <MultiCheckbox options={DELIVERY_FORMATS} selected={config.delivery.formats} onChange={v => setSub('delivery', 'formats', v)} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 max-w-[300px]">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Delivery Method</label>
                    <select value={config.delivery.method} onChange={e => setSub('delivery', 'method', e.target.value)} className={inputCls}>
                        {DELIVERY_METHODS.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>
            </SectionCard>

            {/* ── 10. Usage Rights ── */}
            <SectionCard title="10. Usage Rights & Ownership" icon={<FileCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.rights.client_owns_final} onChange={e => setSub('rights', 'client_owns_final', e.target.checked)} className={checkCls} />
                        Client owns final approved design
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.rights.editable_included} onChange={e => setSub('rights', 'editable_included', e.target.checked)} className={checkCls} />
                        Editable source files included
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.rights.stock_transferable} onChange={e => setSub('rights', 'stock_transferable', e.target.checked)} className={checkCls} />
                        Stock licenses are transferable
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.rights.portfolio_usage} onChange={e => setSub('rights', 'portfolio_usage', e.target.checked)} className={checkCls} />
                        Khrien can use in portfolio
                    </label>
                </div>
            </SectionCard>

            {/* ── 11. Print ── */}
            <SectionCard title="11. Print & Production" icon={<Printer className="w-4 h-4" />} defaultOpen={false}>
                <p className="text-sm text-gray-500 mb-3">If print designs are required, select included services.</p>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.print.coordination} onChange={e => setSub('print', 'coordination', e.target.checked)} className={checkCls} /> Print vendor coordination
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.print.supervision} onChange={e => setSub('print', 'supervision', e.target.checked)} className={checkCls} /> Print supervision
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.print.spec_setup} onChange={e => setSub('print', 'spec_setup', e.target.checked)} className={checkCls} /> Print spec setup (CMYK, bleed)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.print.paper_selection} onChange={e => setSub('print', 'paper_selection', e.target.checked)} className={checkCls} /> Paper type selection support
                    </label>
                </div>
            </SectionCard>

            {/* ── 12. Retainer ── */}
            <SectionCard title="12. Retainer Structure" icon={<Repeat className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <input type="checkbox" checked={config.retainer.is_ongoing} onChange={e => setSub('retainer', 'is_ongoing', e.target.checked)} className={checkCls} />
                        This is an ongoing retainer service
                    </label>

                    {config.retainer.is_ongoing && (
                        <div className="pl-4 space-y-3 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Monthly Design Cap</label>
                                <input type="number" min="1" value={config.retainer.monthly_cap} onChange={e => setSub('retainer', 'monthly_cap', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.retainer.rollover} onChange={e => setSub('retainer', 'rollover', e.target.checked)} className={checkCls} /> Rollover unused designs
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.retainer.priority_support} onChange={e => setSub('retainer', 'priority_support', e.target.checked)} className={checkCls} /> Priority support included
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={config.retainer.dedicated_designer} onChange={e => setSub('retainer', 'dedicated_designer', e.target.checked)} className={checkCls} /> Dedicated designer
                                </label>
                            </div>
                        </div>
                    )}
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
                        className="flex items-center gap-2 px-5 py-2 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
