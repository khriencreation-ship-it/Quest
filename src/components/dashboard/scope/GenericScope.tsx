'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, X, Check, Loader2, ChevronDown, ChevronUp, 
    Layers, Clock, FileText, ShieldCheck, Repeat, 
    Wrench, Trash2, Layout, MoreHorizontal
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CustomSection = {
    id: string;
    title: string;
    items: string[];
    notes: string;
};

export type GenericScopeConfig = {
    hidden_sections: string[];
    categories: string[];
    custom_category: string;
    deliverables: {
        items: string[];
        volume: number;
    };
    turnaround: {
        value: number;
        unit: 'hours' | 'days';
        express_available: boolean;
        delivery_mode: string;
    };
    content: {
        copy_provider: string;
        asset_provider: string;
    };
    revisions: {
        rounds: number;
        what_counts: string;
        redesign_definition: string;
    };
    delivery: {
        formats: string[];
        method: string;
    };
    rights: {
        client_owns_final: boolean;
        portfolio_usage: boolean;
        source_files_included: boolean;
    };
    retainer: {
        is_ongoing: boolean;
        monthly_cap: number;
        rollover: boolean;
        priority_support: boolean;
    };
    custom_sections: CustomSection[];
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<GenericScopeConfig>;
    onClose: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_MODES = ['Batch delivery', 'Daily updates', 'Milestone based'];
const PROVIDERS = ['Client provides', 'Khrien provides', 'Shared responsibility', 'Not applicable'];
const UNITS = ['hours', 'days'];
const DELIVERY_METHODS = ['Google Drive', 'Dropbox', 'Direct Link', 'Email'];

const DEFAULT_SECTIONS = [
    { id: 'categories', title: 'Service Categories', icon: <Layers className="w-4 h-4" /> },
    { id: 'deliverables', title: 'Deliverables & Volume', icon: <FileText className="w-4 h-4" /> },
    { id: 'turnaround', title: 'Turnaround & Scheduling', icon: <Clock className="w-4 h-4" /> },
    { id: 'revisions', title: 'Revision Policy', icon: <Repeat className="w-4 h-4" /> },
    { id: 'delivery', title: 'File Delivery', icon: <Layout className="w-4 h-4" /> },
    { id: 'rights', title: 'Usage Rights', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'retainer', title: 'Retainer Structure', icon: <Repeat className="w-4 h-4" /> },
];

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-[#2eb781] cursor-pointer rounded shrink-0';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children, defaultOpen = true, onDelete }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; onDelete?: () => void }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center">
                <button
                    onClick={() => setOpen(o => !o)}
                    className="flex-1 flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-[#2eb781]">
                            {icon}
                        </div>
                        <span className="font-semibold text-gray-900">{title}</span>
                    </div>
                </button>
                {onDelete && (
                    <button 
                        onClick={onDelete}
                        className="p-4 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Section"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
                <div className="pr-6 text-gray-300">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>
            {open && <div className="px-6 pb-6 pt-2 border-t border-gray-100">{children}</div>}
        </div>
    );
}

function TagBuilder({ value, onChange, placeholder }: { value: string[]; onChange: (val: string[]) => void; placeholder: string }) {
    const [input, setInput] = useState('');
    
    const add = () => {
        if (input.trim() && !value.includes(input.trim())) {
            onChange([...value, input.trim()]);
            setInput('');
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
                    placeholder={placeholder}
                    className={inputCls}
                />
                <button
                    type="button"
                    onClick={add}
                    className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all"
                >
                    Add
                </button>
            </div>
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {tag}
                            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="hover:text-emerald-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GenericScope({ initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<GenericScopeConfig>({
        hidden_sections: initialConfig.hidden_sections || [],
        categories: initialConfig.categories || [],
        custom_category: initialConfig.custom_category || '',
        deliverables: {
            items: [],
            volume: 1,
            ...(initialConfig.deliverables || {})
        },
        turnaround: {
            value: 48,
            unit: 'hours',
            express_available: false,
            delivery_mode: DELIVERY_MODES[0],
            ...(initialConfig.turnaround || {})
        },
        content: {
            copy_provider: PROVIDERS[0],
            asset_provider: PROVIDERS[0],
            ...(initialConfig.content || {})
        },
        revisions: {
            rounds: 2,
            what_counts: 'Minor tweaks and adjustments.',
            redesign_definition: 'Fundamental change to concept or requirements.',
            ...(initialConfig.revisions || {})
        },
        delivery: {
            formats: ['JPG', 'PNG'],
            method: DELIVERY_METHODS[0],
            ...(initialConfig.delivery || {})
        },
        rights: {
            client_owns_final: true,
            portfolio_usage: true,
            source_files_included: false,
            ...(initialConfig.rights || {})
        },
        retainer: {
            is_ongoing: false,
            monthly_cap: 10,
            rollover: false,
            priority_support: false,
            ...(initialConfig.retainer || {})
        },
        custom_sections: initialConfig.custom_sections || []
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    function setTop<K extends keyof GenericScopeConfig>(key: K, val: GenericScopeConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    function setSub<K extends keyof GenericScopeConfig>(section: K, key: string, val: any) {
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

    const addCustomSection = () => {
        const newSection: CustomSection = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'New Section',
            items: [],
            notes: ''
        };
        setTop('custom_sections', [...config.custom_sections, newSection]);
    };

    const updateCustomSection = (id: string, updates: Partial<CustomSection>) => {
        setTop('custom_sections', config.custom_sections.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeCustomSection = (id: string) => {
        setTop('custom_sections', config.custom_sections.filter(s => s.id !== id));
    };

    const hideSection = (id: string) => {
        setTop('hidden_sections', [...config.hidden_sections, id]);
    };

    const showSection = (id: string) => {
        setTop('hidden_sections', config.hidden_sections.filter(sid => sid !== id));
    };

    const isVisible = (id: string) => !config.hidden_sections.includes(id);

    const [showAddMenu, setShowAddMenu] = useState(false);

    // Filter defaults that are currently hidden
    const hiddenDefaults = DEFAULT_SECTIONS.filter(s => !isVisible(s.id));

    return (
        <div className="space-y-4">
            {/* 1. Categories */}
            {isVisible('categories') && (
                <SectionCard title="1. Service Categories" icon={<Layers className="w-4 h-4" />} onDelete={() => hideSection('categories')}>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Standard Categories</label>
                    <TagBuilder 
                        value={config.categories} 
                        onChange={v => setTop('categories', v)} 
                        placeholder="e.g. Portrait, Event, Commercial..." 
                    />
                </SectionCard>
            )}

            {/* 2. Deliverables */}
            {isVisible('deliverables') && (
                <SectionCard title="2. Deliverables & Volume" icon={<FileText className="w-4 h-4" />} onDelete={() => hideSection('deliverables')}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Volume / Count</label>
                            <input type="number" min="1" value={config.deliverables.volume} onChange={e => setSub('deliverables', 'volume', parseInt(e.target.value))} className={inputCls} />
                        </div>
                    </div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Items to Deliver</label>
                    <TagBuilder 
                        value={config.deliverables.items} 
                        onChange={v => setSub('deliverables', 'items', v)} 
                        placeholder="e.g. Edited Photos, 4K Video, PDF Report..." 
                    />
                </SectionCard>
            )}

            {/* 3. Turnaround */}
            {isVisible('turnaround') && (
                <SectionCard title="3. Turnaround & Scheduling" icon={<Clock className="w-4 h-4" />} onDelete={() => hideSection('turnaround')}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Timeframe</label>
                            <div className="flex gap-2">
                                <input type="number" min="1" value={config.turnaround.value} onChange={e => setSub('turnaround', 'value', parseInt(e.target.value))} className={inputCls} />
                                <select value={config.turnaround.unit} onChange={e => setSub('turnaround', 'unit', e.target.value)} className={inputCls}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Delivery Mode</label>
                            <select value={config.turnaround.delivery_mode} onChange={e => setSub('turnaround', 'delivery_mode', e.target.value)} className={inputCls}>
                                {DELIVERY_MODES.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.turnaround.express_available} onChange={e => setSub('turnaround', 'express_available', e.target.checked)} className={checkCls} /> Express available
                            </label>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* 4. Revisions */}
            {isVisible('revisions') && (
                <SectionCard title="4. Revision Policy" icon={<Repeat className="w-4 h-4" />} defaultOpen={false} onDelete={() => hideSection('revisions')}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Rounds of Revisions</label>
                            <input type="number" min="0" value={config.revisions.rounds} onChange={e => setSub('revisions', 'rounds', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">What is a revision?</label>
                                <textarea rows={2} value={config.revisions.what_counts} onChange={e => setSub('revisions', 'what_counts', e.target.value)} className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">What is a redesign?</label>
                                <textarea rows={2} value={config.revisions.redesign_definition} onChange={e => setSub('revisions', 'redesign_definition', e.target.value)} className={`${inputCls} resize-none`} />
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* 5. Delivery */}
            {isVisible('delivery') && (
                <SectionCard title="5. File Delivery" icon={<Layout className="w-4 h-4" />} defaultOpen={false} onDelete={() => hideSection('delivery')}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">File Formats</label>
                            <TagBuilder value={config.delivery.formats} onChange={v => setSub('delivery', 'formats', v)} placeholder="e.g. JPG, PNG, PDF..." />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Delivery Method</label>
                            <select value={config.delivery.method} onChange={e => setSub('delivery', 'method', e.target.value)} className={inputCls}>
                                {DELIVERY_METHODS.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* 6. Legal / Rights */}
            {isVisible('rights') && (
                <SectionCard title="6. Usage Rights" icon={<ShieldCheck className="w-4 h-4" />} defaultOpen={false} onDelete={() => hideSection('rights')}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                            <input type="checkbox" checked={config.rights.client_owns_final} onChange={e => setSub('rights', 'client_owns_final', e.target.checked)} className={checkCls} /> Client owns final assets
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                            <input type="checkbox" checked={config.rights.source_files_included} onChange={e => setSub('rights', 'source_files_included', e.target.checked)} className={checkCls} /> Source files included
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50 col-span-1 sm:col-span-2">
                            <input type="checkbox" checked={config.rights.portfolio_usage} onChange={e => setSub('rights', 'portfolio_usage', e.target.checked)} className={checkCls} /> Khrien can use in portfolio
                        </label>
                    </div>
                </SectionCard>
            )}

            {/* 7. Retainer */}
            {isVisible('retainer') && (
                <SectionCard title="7. Retainer Structure" icon={<Repeat className="w-4 h-4" />} defaultOpen={false} onDelete={() => hideSection('retainer')}>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 uppercase tracking-wide">
                            <input type="checkbox" checked={config.retainer.is_ongoing} onChange={e => setSub('retainer', 'is_ongoing', e.target.checked)} className={checkCls} /> This is a monthly retainer
                        </label>
                        {config.retainer.is_ongoing && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pl-4 border-l-2 border-emerald-100">
                                 <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Monthly Cap</label>
                                    <input type="number" min="1" value={config.retainer.monthly_cap} onChange={e => setSub('retainer', 'monthly_cap', parseInt(e.target.value))} className={inputCls} />
                                </div>
                                <div className="flex flex-col gap-2 pt-6">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={config.retainer.rollover} onChange={e => setSub('retainer', 'rollover', e.target.checked)} className={checkCls} /> Rollover unused units
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={config.retainer.priority_support} onChange={e => setSub('retainer', 'priority_support', e.target.checked)} className={checkCls} /> Priority support
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            )}

            {/* Custom Sections */}
            {config.custom_sections.map((section, idx) => (
                <SectionCard 
                    key={section.id} 
                    title={`${idx + 8}. ${section.title}`} 
                    icon={<MoreHorizontal className="w-4 h-4" />}
                    onDelete={() => removeCustomSection(section.id)}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Section Title</label>
                            <input 
                                type="text" 
                                value={section.title} 
                                onChange={e => updateCustomSection(section.id, { title: e.target.value })} 
                                className={inputCls} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Items</label>
                            <TagBuilder 
                                value={section.items} 
                                onChange={items => updateCustomSection(section.id, { items })} 
                                placeholder="Add item..." 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes (Optional)</label>
                            <textarea 
                                rows={2} 
                                value={section.notes} 
                                onChange={e => updateCustomSection(section.id, { notes: e.target.value })} 
                                className={`${inputCls} resize-none`} 
                            />
                        </div>
                    </div>
                </SectionCard>
            ))}

            {/* Add Section Button */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-[#2eb781] hover:border-[#2eb781] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Section
                </button>

                {showAddMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 py-2 animate-in slide-in-from-bottom-2 duration-200">
                            {hiddenDefaults.length > 0 && (
                                <>
                                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Restore Sections</div>
                                    {hiddenDefaults.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => { showSection(s.id); setShowAddMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#2eb781] transition-colors font-medium border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                {s.icon}
                                            </div>
                                            {s.title}
                                        </button>
                                    ))}
                                    <div className="my-2 border-t border-gray-100" />
                                </>
                            )}
                            <button
                                onClick={() => { addCustomSection(); setShowAddMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-900 hover:bg-emerald-50 hover:text-[#2eb781] transition-colors font-bold"
                            >
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                    <Plus className="w-4 h-4" />
                                </div>
                                Create Custom Section
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Save Bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to clear all scope configuration and hidden sections?')) {
                                setConfig({
                                    hidden_sections: [],
                                    categories: [],
                                    custom_category: '',
                                    deliverables: { items: [], volume: 1 },
                                    turnaround: { value: 48, unit: 'hours', express_available: false, delivery_mode: DELIVERY_MODES[0] },
                                    content: { copy_provider: PROVIDERS[0], asset_provider: PROVIDERS[0] },
                                    revisions: { rounds: 2, what_counts: '', redesign_definition: '' },
                                    delivery: { formats: [], method: DELIVERY_METHODS[0] },
                                    rights: { client_owns_final: true, portfolio_usage: true, source_files_included: false },
                                    retainer: { is_ongoing: false, monthly_cap: 10, rollover: false, priority_support: false },
                                    custom_sections: []
                                });
                                setSaved(false);
                            }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear Scope Configuration"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {saved && !error && (
                        <span className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                            <Check className="w-4 h-4" /> Scope saved successfully
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-[#2eb781] text-white text-sm font-bold rounded-xl hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
