'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Instagram, Linkedin, Youtube, Facebook, Twitter,
    Image, Film, LayoutGrid, Play, Type, FileImage,
    BarChart2, Megaphone, Users, Hash, Search, Eye, Handshake,
    ChevronDown, ChevronUp, Plus, X, Check, Loader2, Clock, Calendar
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = { id: string; label: string; icon?: string };
type DaySchedule = { day: string; content_types: string[] };

type SocialMediaConfig = {
    platforms: string[];
    content_types: string[];
    posting_schedule: DaySchedule[];
    reporting: { frequency: string; report_day: string; report_week: string; formats: string[] };
    ads: { enabled: boolean; platforms: string[]; notes: string; start_date: string; end_date: string };
    extras: {
        community_management: boolean;
        hashtag_research: boolean;
        competitor_analysis: boolean;
        brand_monitoring: boolean;
        influencer_collab: boolean;
    };
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: SocialMediaConfig;
    onClose: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'X / Twitter' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'pinterest', label: 'Pinterest' },
    { id: 'threads', label: 'Threads' },
    { id: 'snapchat', label: 'Snapchat' },
];

const CONTENT_TYPES = [
    { id: 'Single Post', label: 'Single Post' },
    { id: 'carousels', label: 'Carousels' },
    { id: 'short_videos', label: 'Short Videos / Reels' },
    { id: 'long_videos', label: 'Long Videos' },
    { id: 'stories', label: 'Stories' },
    { id: 'text_posts', label: 'Text / Thread Posts' },
    { id: 'ugc', label: 'User Generated Content' },
    { id: 'infographics', label: 'Infographics' },
    
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const REPORTING_FREQUENCIES = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'];
const REPORT_FORMATS = ['PDF Report', 'Presentation Slides', 'Live Dashboard', 'Email Summary'];
const WEEK_ORDINALS = ['1st', '2nd', '3rd', '4th', 'Last'];

// Which frequencies use a day-of-week picker vs ordinal+day picker vs nothing
function getDeliveryMode(frequency: string): 'none' | 'weekday' | 'ordinal' {
    if (frequency === 'Daily') return 'none';
    if (frequency === 'Monthly' || frequency === 'Quarterly') return 'ordinal';
    return 'weekday'; // Weekly, Bi-weekly
}

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-[#2eb781] cursor-pointer rounded';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2eb781]/10 rounded-lg flex items-center justify-center text-[#2eb781]">
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
    options: { id: string; label: string }[];
    selected: string[];
    onChange: (val: string[]) => void;
}) {
    function toggle(id: string) {
        onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    }
    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {options.map(o => {
                const active = selected.includes(o.id);
                return (
                    <button
                        key={o.id}
                        type="button"
                        onClick={() => toggle(o.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active
                            ? 'bg-[#2eb781]/10 border-[#2eb781]/30 text-[#2eb781]'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        {active && <Check className="w-3 h-3" />}
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialMediaScope({ serviceId, initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<SocialMediaConfig>({
        platforms: initialConfig?.platforms || [],
        content_types: initialConfig?.content_types || [],
        posting_schedule: initialConfig?.posting_schedule || [],
        reporting: initialConfig?.reporting || { frequency: 'Weekly', report_day: 'Monday', report_week: '1st', formats: [] },
        ads: initialConfig?.ads || { enabled: false, platforms: [], notes: '', start_date: '', end_date: '' },
        extras: initialConfig?.extras || {
            community_management: false,
            hashtag_research: false,
            competitor_analysis: false,
            brand_monitoring: false,
            influencer_collab: false,
        },
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // helpers
    function set<K extends keyof SocialMediaConfig>(key: K, val: SocialMediaConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    // ── Posting Schedule ──────────────────────────────────────────────────────
    function addScheduleRow() {
        const usedDays = config.posting_schedule.map(r => r.day);
        const nextDay = DAYS.find(d => !usedDays.includes(d));
        if (!nextDay) return;
        set('posting_schedule', [...config.posting_schedule, { day: nextDay, content_types: [] }]);
    }

    function removeScheduleRow(idx: number) {
        set('posting_schedule', config.posting_schedule.filter((_, i) => i !== idx));
    }

    function updateScheduleRow(idx: number, field: keyof DaySchedule, val: any) {
        set('posting_schedule', config.posting_schedule.map((r, i) => i === idx ? { ...r, [field]: val } : r));
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

            {/* ── Platforms ── */}
            <SectionCard title="Platforms" icon={<Instagram className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mt-1">Which platforms will be managed under this service?</p>
                <MultiCheckbox options={PLATFORMS} selected={config.platforms} onChange={v => set('platforms', v)} />
            </SectionCard>

            {/* ── Content Types ── */}
            <SectionCard title="Content Types" icon={<FileImage className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mt-1">What types of content will be produced?</p>
                <MultiCheckbox options={CONTENT_TYPES} selected={config.content_types} onChange={v => set('content_types', v)} />
            </SectionCard>

            {/* ── Posting Schedule ── */}
            <SectionCard title="Posting Schedule" icon={<Calendar className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mt-1">
                    Define which days posts go out and what content type is published on each day.
                </p>

                <div className="mt-4 space-y-3">
                    {config.posting_schedule.length === 0 && (
                        <p className="text-sm text-gray-400 italic">No schedule set. Add a posting day below.</p>
                    )}

                    {config.posting_schedule.map((row, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex flex-col gap-2 flex-1">
                                {/* Day picker */}
                                <div className="flex items-center gap-3">
                                    <select
                                        value={row.day}
                                        onChange={e => updateScheduleRow(idx, 'day', e.target.value)}
                                        className={`${inputCls} w-40`}
                                    >
                                        {DAYS.map(d => (
                                            <option key={d} value={d} disabled={d !== row.day && config.posting_schedule.some(r => r.day === d)}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-sm text-gray-500">→ content type(s):</span>
                                </div>

                                {/* Content types for this day */}
                                <div className="flex flex-wrap gap-2">
                                    {CONTENT_TYPES.filter(ct => config.content_types.includes(ct.id)).map(ct => {
                                        const active = row.content_types.includes(ct.id);
                                        return (
                                            <button
                                                key={ct.id}
                                                type="button"
                                                onClick={() => {
                                                    const updated = active
                                                        ? row.content_types.filter(x => x !== ct.id)
                                                        : [...row.content_types, ct.id];
                                                    updateScheduleRow(idx, 'content_types', updated);
                                                }}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active
                                                    ? 'bg-[#2eb781]/10 border-[#2eb781]/30 text-[#2eb781]'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                            >
                                                {active && <Check className="w-3 h-3" />}
                                                {ct.label}
                                            </button>
                                        );
                                    })}
                                    {config.content_types.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">Select content types above first.</p>
                                    )}
                                </div>
                            </div>

                            <button onClick={() => removeScheduleRow(idx)} className="mt-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {config.posting_schedule.length < 7 && (
                        <button
                            onClick={addScheduleRow}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2eb781] bg-[#2eb781]/10 hover:bg-[#2eb781]/20 rounded-xl border border-[#2eb781]/20 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Posting Day
                        </button>
                    )}

                    {config.posting_schedule.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            📊 {config.posting_schedule.length} day{config.posting_schedule.length !== 1 ? 's' : ''} per week
                            ({config.posting_schedule.map(r => r.day.substring(0, 3)).join(', ')})
                        </p>
                    )}
                </div>
            </SectionCard>

            {/* ── Reporting & Feedback ── */}
            <SectionCard title="Reporting & Feedback" icon={<BarChart2 className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mt-1">How and when will performance reports be delivered?</p>

                <div className="mt-4 space-y-4">
                    {/* Row 1: Frequency */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Report Frequency</label>
                        <select
                            value={config.reporting.frequency}
                            onChange={e => set('reporting', {
                                ...config.reporting,
                                frequency: e.target.value,
                                // Reset delivery day when frequency changes
                                report_day: 'Monday',
                                report_week: '1st',
                            })}
                            className={inputCls}
                        >
                            {REPORTING_FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </div>

                    {/* Row 2: Delivery day — conditional on frequency */}
                    {(() => {
                        const mode = getDeliveryMode(config.reporting.frequency);

                        if (mode === 'none') return (
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                                <p className="text-sm text-blue-700">
                                    Reports are delivered <strong>every day</strong>.
                                </p>
                            </div>
                        );

                        if (mode === 'weekday') return (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Report Delivery Day</label>
                                <select
                                    value={config.reporting.report_day}
                                    onChange={e => set('reporting', { ...config.reporting, report_day: e.target.value })}
                                    className={inputCls}
                                >
                                    {DAYS.map(d => <option key={d}>{d}</option>)}
                                </select>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    Reports go out every <strong>{config.reporting.report_day}</strong>.
                                </p>
                            </div>
                        );

                        // ordinal mode — Monthly / Quarterly
                        return (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Report Delivery Day</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Week of month</label>
                                        <select
                                            value={config.reporting.report_week || '1st'}
                                            onChange={e => set('reporting', { ...config.reporting, report_week: e.target.value })}
                                            className={inputCls}
                                        >
                                            {WEEK_ORDINALS.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Day of week</label>
                                        <select
                                            value={config.reporting.report_day}
                                            onChange={e => set('reporting', { ...config.reporting, report_day: e.target.value })}
                                            className={inputCls}
                                        >
                                            {DAYS.map(d => <option key={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    Reports go out on the <strong>{config.reporting.report_week || '1st'} {config.reporting.report_day}</strong> of each {config.reporting.frequency === 'Quarterly' ? 'quarter' : 'month'}.
                                </p>
                            </div>
                        );
                    })()}
                </div>

                <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Report Format(s)</label>
                    <MultiCheckbox
                        options={REPORT_FORMATS.map(f => ({ id: f, label: f }))}
                        selected={config.reporting.formats}
                        onChange={v => set('reporting', { ...config.reporting, formats: v })}
                    />
                </div>
            </SectionCard>

            {/* ── Ads Management ── */}
            <SectionCard title="Ads Management" icon={<Megaphone className="w-4 h-4" />}>
                <div className="mt-2 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.ads.enabled}
                            onChange={e => set('ads', { ...config.ads, enabled: e.target.checked })}
                            className={checkCls}
                        />
                        <span className="text-sm font-medium text-gray-900">Include paid advertising management</span>
                    </label>

                    {config.ads.enabled && (
                        <div className="pl-7 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ad Platforms</label>
                                <MultiCheckbox
                                    options={PLATFORMS.filter(p => ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'youtube', 'snapchat'].includes(p.id))}
                                    selected={config.ads.platforms}
                                    onChange={v => set('ads', { ...config.ads, platforms: v })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ad Start Date</label>
                                    <input
                                        type="date"
                                        value={config.ads.start_date}
                                        onChange={e => set('ads', { ...config.ads, start_date: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ad End Date</label>
                                    <input
                                        type="date"
                                        value={config.ads.end_date}
                                        onChange={e => set('ads', { ...config.ads, end_date: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes / Budget Range</label>
                                <textarea
                                    rows={2}
                                    value={config.ads.notes}
                                    onChange={e => set('ads', { ...config.ads, notes: e.target.value })}
                                    placeholder="e.g. Monthly budget ₦500,000 – ₦2,000,000. Retargeting + awareness campaigns."
                                    className={`${inputCls} resize-none`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </SectionCard>



            {/* ── Save Bar ── */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 flex items-center justify-between">
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
                        className="flex items-center gap-2 px-5 py-2 bg-[#2eb781] text-white text-sm font-semibold rounded-xl hover:bg-[#279e6f] transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
