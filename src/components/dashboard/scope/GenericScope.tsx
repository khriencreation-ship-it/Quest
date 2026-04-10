'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, X, Check, Loader2, ChevronDown, ChevronUp,
    Layers, Clock, FileText, ShieldCheck, Repeat,
    Wrench, Trash2, Layout, MoreHorizontal
} from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FieldType = 'input' | 'textarea' | 'select' | 'tags' | 'checkbox' | 'number';

export type CustomField = {
    id: string;
    type: FieldType;
    label: string;
    value: any;
    options?: string[]; // For select
};

export type CustomSection = {
    id: string;
    title: string;
    fields: CustomField[];
};

export type GenericScopeConfig = {
    sections: CustomSection[];
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<GenericScopeConfig>;
    onClose: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TEMPLATES: { title: string; fields: Omit<CustomField, 'id'>[] }[] = [
    {
        title: 'Service Categories',
        fields: [
            { type: 'tags', label: 'Standard Categories', value: [] }
        ]
    },
    {
        title: 'Deliverables & Volume',
        fields: [
            { type: 'number', label: 'Volume / Count', value: 1 },
            { type: 'tags', label: 'Items to Deliver', value: [] }
        ]
    },
    {
        title: 'Turnaround & Scheduling',
        fields: [
            { type: 'number', label: 'Timeframe', value: 48 },
            { type: 'select', label: 'Unit', value: 'hours', options: ['hours', 'days', 'weeks'] },
            { type: 'select', label: 'Delivery Mode', value: 'Batch delivery', options: ['Batch delivery', 'Daily updates', 'Milestone based'] },
            { type: 'checkbox', label: 'Express available', value: false }
        ]
    },
    {
        title: 'Revision Policy',
        fields: [
            { type: 'number', label: 'Rounds of Revisions', value: 2 },
            { type: 'textarea', label: 'What is a revision?', value: 'Minor tweaks and adjustments.' },
            { type: 'textarea', label: 'What is a redesign?', value: 'Fundamental change to concept or requirements.' }
        ]
    },
    {
        title: 'File Delivery',
        fields: [
            { type: 'tags', label: 'File Formats', value: ['JPG', 'PNG'] },
            { type: 'select', label: 'Delivery Method', value: 'Google Drive', options: ['Google Drive', 'Dropbox', 'Direct Link', 'Email'] }
        ]
    },
    {
        title: 'Usage Rights',
        fields: [
            { type: 'checkbox', label: 'Client owns final assets', value: true },
            { type: 'checkbox', label: 'Source files included', value: false },
            { type: 'checkbox', label: 'Khrien can use in portfolio', value: true }
        ]
    }
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

function DynamicFieldRenderer({ field, onUpdate }: { field: CustomField; onUpdate: (updates: Partial<CustomField>) => void }) {
    switch (field.type) {
        case 'input':
            return (
                <input
                    type="text"
                    value={field.value}
                    onChange={e => onUpdate({ value: e.target.value })}
                    className={inputCls}
                />
            );
        case 'textarea':
            return (
                <textarea
                    rows={3}
                    value={field.value}
                    onChange={e => onUpdate({ value: e.target.value })}
                    className={`${inputCls} resize-none`}
                />
            );
        case 'number':
            return (
                <input
                    type="number"
                    value={field.value}
                    onChange={e => onUpdate({ value: parseInt(e.target.value) || 0 })}
                    className={inputCls}
                />
            );
        case 'select':
            return (
                <select
                    value={field.value}
                    onChange={e => onUpdate({ value: e.target.value })}
                    className={inputCls}
                >
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        case 'checkbox':
            return (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={e => onUpdate({ value: e.target.checked })}
                        className={checkCls}
                    />
                </label>
            );
        case 'tags':
            return (
                <TagBuilder
                    value={field.value || []}
                    onChange={val => onUpdate({ value: val })}
                    placeholder={`Add item...`}
                />
            );
        default:
            return null;
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GenericScope({ initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<GenericScopeConfig>({
        sections: initialConfig.sections || [
            {
                id: 'categories',
                title: 'Service Categories',
                fields: [{ id: 'cat-1', type: 'tags', label: 'Standard Categories', value: [] }]
            },
            {
                id: 'deliverables',
                title: 'Deliverables & Volume',
                fields: [
                    { id: 'del-1', type: 'number', label: 'Volume / Count', value: 1 },
                    { id: 'del-2', type: 'tags', label: 'Items to Deliver', value: [] }
                ]
            }
        ]
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showClearAllModal, setShowClearAllModal] = useState(false);

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

    const addSection = (template?: typeof SECTION_TEMPLATES[0]) => {
        const newSection: CustomSection = {
            id: Math.random().toString(36).substr(2, 9),
            title: template?.title || 'New Section',
            fields: template?.fields.map(f => ({ ...f, id: Math.random().toString(36).substr(2, 9) })) || []
        };
        setConfig(c => ({ ...c, sections: [...c.sections, newSection] }));
        setSaved(false);
    };

    const removeSection = (id: string) => {
        setConfig(c => ({ ...c, sections: c.sections.filter(s => s.id !== id) }));
        setSaved(false);
    };

    const updateSection = (id: string, updates: Partial<CustomSection>) => {
        setConfig(c => ({
            ...c,
            sections: c.sections.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
        setSaved(false);
    };

    const addField = (sectionId: string, type: FieldType) => {
        const newField: CustomField = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            value: type === 'tags' ? [] : type === 'checkbox' ? false : type === 'number' ? 0 : '',
            options: type === 'select' ? ['Option 1', 'Option 2'] : undefined
        };
        setConfig(c => ({
            ...c,
            sections: c.sections.map(s => s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s)
        }));
        setSaved(false);
    };

    const updateField = (sectionId: string, fieldId: string, updates: Partial<CustomField>) => {
        setConfig(c => ({
            ...c,
            sections: c.sections.map(s => s.id === sectionId ? {
                ...s,
                fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
            } : s)
        }));
        setSaved(false);
    };

    const removeField = (sectionId: string, fieldId: string) => {
        setConfig(c => ({
            ...c,
            sections: c.sections.map(s => s.id === sectionId ? {
                ...s,
                fields: s.fields.filter(f => f.id !== fieldId)
            } : s)
        }));
        setSaved(false);
    };

    return (
        <div className="space-y-6">
            {config.sections.map((section, idx) => (
                <SectionCard
                    key={section.id}
                    title={`${idx + 1}. ${section.title}`}
                    icon={<MoreHorizontal className="w-4 h-4" />}
                    onDelete={() => removeSection(section.id)}
                >
                    <div className="space-y-6">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 space-y-1.5">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Section Title</label>
                                <input
                                    type="text"
                                    value={section.title}
                                    onChange={e => updateSection(section.id, { title: e.target.value })}
                                    className={`${inputCls} font-semibold text-base`}
                                />
                            </div>
                        </div>

                        <div className="space-y-5">
                            {section.fields.map(field => (
                                <div key={field.id} className="group relative bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 max-w-[200px]">
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={e => updateField(section.id, field.id, { label: e.target.value })}
                                                className="bg-transparent border-none p-0 text-xs font-bold text-gray-500 uppercase tracking-wide focus:ring-0 w-full"
                                                placeholder="Field Label"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeField(section.id, field.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <DynamicFieldRenderer
                                        field={field}
                                        onUpdate={(updates) => updateField(section.id, field.id, updates)}
                                    />

                                    {field.type === 'select' && (
                                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Options (Comma separated)</label>
                                            <input
                                                type="text"
                                                value={field.options?.join(', ') || ''}
                                                onChange={e => updateField(section.id, field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                className="w-full bg-white border border-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:border-emerald-200"
                                                placeholder="e.g. Option 1, Option 2, Option 3"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Field Button */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {(['input', 'textarea', 'select', 'tags', 'checkbox', 'number'] as FieldType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => addField(section.id, type)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-1.5"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            ))}

            {/* Add Section Menu */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-[#2eb781] hover:border-[#2eb781] hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 font-bold text-base"
                >
                    <Plus className="w-6 h-6" />
                    New Section
                </button>

                {showAddMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                        <div className="absolute bottom-full left-0 w-full mb-4 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-4 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                                    <div className="px-2 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Quick Templates</div>
                                    <div className="space-y-1">
                                        {SECTION_TEMPLATES.map(t => (
                                            <button
                                                key={t.title}
                                                onClick={() => { addSection(t); setShowAddMenu(false); }}
                                                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:text-[#2eb781] hover:shadow-sm transition-all flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                    <Layout className="w-3.5 h-3.5" />
                                                </div>
                                                {t.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col justify-center items-center bg-white text-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-3">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">Custom Section</h4>
                                    <p className="text-xs text-gray-500 mb-4 max-w-[200px]">Start with a blank section and add fields manually.</p>
                                    <button
                                        onClick={() => { addSection(); setShowAddMenu(false); }}
                                        className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                                    >
                                        Create Blank
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Save Bar */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-200 px-8 py-5 -mx-8 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowClearAllModal(true)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Clear All"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <ConfirmationModal
                        isOpen={showClearAllModal}
                        onClose={() => setShowClearAllModal(false)}
                        onConfirm={() => {
                            setConfig({ sections: [] });
                            setSaved(false);
                            setShowClearAllModal(false);
                        }}
                        title="Clear All Configuration?"
                        message="This will remove all sections and fields from this service scope. This action cannot be undone."
                        confirmLabel="Clear Everything"
                        variant="danger"
                    />
                    {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                    {saved && !error && (
                        <span className="flex items-center gap-2 text-sm text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                            <Check className="w-4 h-4" /> Saved Successfully
                        </span>
                    )}
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2.5 px-8 py-2.5 bg-[#2eb781] text-white text-sm font-black rounded-xl hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-xl shadow-emerald-100 active:scale-95"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
