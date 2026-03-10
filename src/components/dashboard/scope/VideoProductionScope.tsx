'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Video, Layers, PenTool, Camera, Scissors, RefreshCcw,
    FileText, Monitor, FileImage, ShieldCheck, Clock,
    CalendarCheck, Repeat, ChevronDown, ChevronUp, Check, Loader2,
    MapPin, Users, Film
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type VideoProductionConfig = {
    // 1. Project Type
    project_types: string[];
    custom_project_type: string;

    // 2. Pre-Production
    pre_production: {
        strategy: {
            concept: boolean;
            script: boolean;
            storyboard: boolean;
            creative_direction: boolean;
            deliverables: string[];
        };
        planning: {
            scouting: boolean;
            casting: boolean;
            talent_sourcing: boolean;
            wardrobe: boolean;
            props: boolean;
            schedule: boolean;
            callsheet: boolean;
        };
    };

    // 3. Production Scope (Filming)
    production: {
        shoot_duration: string[];
        crew_size: string[];
        equipment: {
            camera_level: string;
            lighting: boolean;
            audio: boolean;
            drone: boolean;
            gimbal: boolean;
            multi_cam: boolean;
        };
        location: {
            types: string[];
            travel_included: boolean;
            travel_limit: string;
        };
    };

    // 4. Post-Production (Editing)
    post_production: {
        final_videos: {
            main_count: number;
            short_cuts: number;
            reels: number;
            teasers: number;
        };
        lengths: string[];
        editing_level: string;
        addons: {
            motion_graphics: boolean;
            text_overlays: boolean;
            subtitles: boolean;
            voiceover: boolean;
            music_licensing: boolean;
            sound_design: boolean;
            intro_outro: boolean;
            logo_animation: boolean;
        };
    };

    // 5. Revisions
    revisions: {
        rounds: number;
        window_days: string;
        what_counts: string;
        redesign_definition: string;
        additional_cost: string;
    };

    // 6. Responsibility
    responsibility: {
        script: string;
        brand_assets: string;
        logos: string;
        fonts: string;
        products: string;
        talent: string;
    };

    // 7. Delivery Format
    delivery: {
        resolution: string;
        aspect_ratios: string[];
        file_format: string;
        thumbnail_included: boolean;
        raw_footage_included: boolean;
    };

    // 8. Usage Rights
    rights: {
        usage_types: string[];
        duration: string;
        music_license_included: boolean;
    };

    // 9. Timeline Structure
    timeline: string[];

    // 10. Event Coverage
    event: {
        is_event: boolean;
        hours: number;
        highlight_length: string;
        same_day_edit: boolean;
        cameras: number;
        onsite_editor: boolean;
    };

    // 11. Ongoing Retainer
    retainer: {
        is_ongoing: boolean;
        videos_per_month: number;
        shoot_days_per_month: number;
        turnaround: string;
        content_batching: boolean;
        rollover: boolean;
        priority_support: boolean;
    };
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<VideoProductionConfig>;
    onClose: () => void;
};


// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_TYPES = ['Commercial / Advertisement', 'Social Media Content', 'Brand Film', 'Corporate Video', 'Event Coverage', 'Training / Educational Video', 'Product Demo', 'Testimonial Video', 'Podcast Video', 'Explainer Video', 'Motion Graphics Video', 'Internal Communication Video'];

const PREPROD_DELIVERABLES = ['Approved script', 'Shot list', 'Mood board', 'Production brief'];

const SHOOT_DURATIONS = ['Half-day shoot', 'Full-day shoot', 'Multi-day shoot', 'Hourly coverage'];
const CREW_SIZES = ['Solo videographer', 'Videographer + assistant', 'Full production crew'];
const CAMERA_LEVELS = ['Standard (Mirrorless/DSLR)', 'Cinema Series', 'Premium Cinema (ARRI/RED)'];
const LOCATION_TYPES = ['Client office', 'Studio', 'Outdoor', 'Multiple locations'];

const VIDEO_LENGTHS = ['15 sec', '30 sec', '60 sec', '2–5 minutes', 'Long-form (10+ minutes)'];
const EDITING_LEVELS = ['Basic cut & trim', 'Standard editing (cuts, transitions, music)', 'Advanced editing (color, sound design, graphics)', 'Premium cinematic edit'];

const RESPONSIBILITY_OPTIONS = ['Client provides', 'Khrien provides', 'Not applicable'];

const RESOLUTIONS = ['1080p (FHD)', '4K (UHD)', '6K / 8K'];
const ASPECT_RATIOS = ['16:9 (YouTube/Web)', '1:1 (Instagram/Feed)', '9:16 (Reels/TikTok/Shorts)', '4:5 (Social standard)', '2.35:1 (Cinematic)'];
const FILE_FORMATS = ['MP4 (H.264)', 'MOV (ProRes)', 'Multiple formats'];

const USAGE_TYPES = ['Organic social media only', 'Paid advertising (Digital)', 'TV broadcast rights', 'Internal company use', 'Unrestricted buy-out'];
const TIMELINE_PHASES = ['Pre-production approval', 'Shoot day', 'First edit delivery', 'Revision round(s)', 'Final delivery'];

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-indigo-600 cursor-pointer rounded shrink-0';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
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
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
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

export default function VideoProductionScope({ serviceId, initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<VideoProductionConfig>({
        project_types: initialConfig.project_types || [],
        custom_project_type: initialConfig.custom_project_type || '',

        pre_production: {
            strategy: {
                concept: false,
                script: false,
                storyboard: false,
                creative_direction: false,
                deliverables: [],
                ...(initialConfig.pre_production?.strategy || {})
            },
            planning: {
                scouting: false,
                casting: false,
                talent_sourcing: false,
                wardrobe: false,
                props: false,
                schedule: true,
                callsheet: true,
                ...(initialConfig.pre_production?.planning || {})
            }
        },

        production: {
            shoot_duration: [],
            crew_size: [],
            equipment: {
                camera_level: CAMERA_LEVELS[0],
                lighting: true,
                audio: true,
                drone: false,
                gimbal: true,
                multi_cam: false,
                ...(initialConfig.production?.equipment || {})
            },
            location: {
                types: [],
                travel_included: false,
                travel_limit: '',
                ...(initialConfig.production?.location || {})
            },
            ...(initialConfig.production || {})
        },

        post_production: {
            final_videos: {
                main_count: 1,
                short_cuts: 0,
                reels: 0,
                teasers: 0,
                ...(initialConfig.post_production?.final_videos || {})
            },
            lengths: [],
            editing_level: EDITING_LEVELS[1],
            addons: {
                motion_graphics: false,
                text_overlays: false,
                subtitles: false,
                voiceover: false,
                music_licensing: true,
                sound_design: false,
                intro_outro: false,
                logo_animation: false,
                ...(initialConfig.post_production?.addons || {})
            },
            ...(initialConfig.post_production || {})
        },

        revisions: {
            rounds: 2,
            window_days: '5 days',
            what_counts: 'Minor cut adjustments, text tweaks, color tweaks.',
            redesign_definition: 'Complete story overhaul or re-cutting to a completely new music track.',
            additional_cost: 'Billed per hour or flat fee per round.',
            ...(initialConfig.revisions || {})
        },

        responsibility: {
            script: RESPONSIBILITY_OPTIONS[0],
            brand_assets: RESPONSIBILITY_OPTIONS[0],
            logos: RESPONSIBILITY_OPTIONS[0],
            fonts: RESPONSIBILITY_OPTIONS[0],
            products: RESPONSIBILITY_OPTIONS[0],
            talent: RESPONSIBILITY_OPTIONS[0],
            ...(initialConfig.responsibility || {})
        },

        delivery: {
            resolution: RESOLUTIONS[0],
            aspect_ratios: ['16:9 (YouTube/Web)'],
            file_format: FILE_FORMATS[0],
            thumbnail_included: false,
            raw_footage_included: false,
            ...(initialConfig.delivery || {})
        },

        rights: {
            usage_types: [USAGE_TYPES[0]],
            duration: 'Perpetual',
            music_license_included: true,
            ...(initialConfig.rights || {})
        },

        timeline: initialConfig.timeline || TIMELINE_PHASES,

        event: {
            is_event: false,
            hours: 4,
            highlight_length: '2-3 mins',
            same_day_edit: false,
            cameras: 1,
            onsite_editor: false,
            ...(initialConfig.event || {})
        },

        retainer: {
            is_ongoing: false,
            videos_per_month: 4,
            shoot_days_per_month: 1,
            turnaround: '48-72 hours per video',
            content_batching: true,
            rollover: false,
            priority_support: false,
            ...(initialConfig.retainer || {})
        }
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // helpers
    function setTop<K extends keyof VideoProductionConfig>(key: K, val: VideoProductionConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    function setPreProd<K extends keyof VideoProductionConfig['pre_production']>(sub: K, key: string, val: any) {
        setConfig(c => ({
            ...c,
            pre_production: { ...c.pre_production, [sub]: { ...c.pre_production[sub], [key]: val } }
        }));
        setSaved(false);
    }

    function setProd<K extends keyof VideoProductionConfig['production']>(key: K, val: any) {
        setConfig(c => ({
            ...c,
            production: { ...c.production, [key]: val }
        }));
        setSaved(false);
    }

    function setProdSub(sub: 'equipment' | 'location', key: string, val: any) {
        setConfig(c => ({
            ...c,
            production: { ...c.production, [sub]: { ...c.production[sub], [key]: val } }
        }));
        setSaved(false);
    }

    function setPost<K extends keyof VideoProductionConfig['post_production']>(key: K, val: any) {
        setConfig(c => ({
            ...c,
            post_production: { ...c.post_production, [key]: val }
        }));
        setSaved(false);
    }

    function setPostSub(sub: 'final_videos' | 'addons', key: string, val: any) {
        setConfig(c => ({
            ...c,
            post_production: { ...c.post_production, [sub]: { ...c.post_production[sub], [key]: val } }
        }));
        setSaved(false);
    }

    function setSub<K extends 'revisions' | 'responsibility' | 'delivery' | 'rights' | 'event' | 'retainer'>(section: K, key: string, val: any) {
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
            <SectionCard title="1. Project Type Configuration" icon={<Video className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mb-3">Define the kind of video project this is.</p>
                <MultiCheckbox options={PROJECT_TYPES} selected={config.project_types} onChange={v => setTop('project_types', v)} />
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Custom Project Type</label>
                    <input type="text" value={config.custom_project_type} onChange={e => setTop('custom_project_type', e.target.value)} placeholder="e.g. Docuseries Episode" className={inputCls} />
                </div>
            </SectionCard>

            {/* ── 2. Pre-Production ── */}
            <SectionCard title="2. Pre-Production Scope" icon={<PenTool className="w-4 h-4" />}>
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">A. Strategy & Concept Development</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.strategy.concept} onChange={e => setPreProd('strategy', 'concept', e.target.checked)} className={checkCls} /> Concept Development
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.strategy.script} onChange={e => setPreProd('strategy', 'script', e.target.checked)} className={checkCls} /> Scriptwriting
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.strategy.storyboard} onChange={e => setPreProd('strategy', 'storyboard', e.target.checked)} className={checkCls} /> Storyboarding
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.strategy.creative_direction} onChange={e => setPreProd('strategy', 'creative_direction', e.target.checked)} className={checkCls} /> Creative Direction
                            </label>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Deliverables</label>
                            <MultiCheckbox options={PREPROD_DELIVERABLES} selected={config.pre_production.strategy.deliverables} onChange={v => setPreProd('strategy', 'deliverables', v)} />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">B. Planning & Logistics</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.scouting} onChange={e => setPreProd('planning', 'scouting', e.target.checked)} className={checkCls} /> Location Scouting
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.casting} onChange={e => setPreProd('planning', 'casting', e.target.checked)} className={checkCls} /> Casting
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.talent_sourcing} onChange={e => setPreProd('planning', 'talent_sourcing', e.target.checked)} className={checkCls} /> Talent Sourcing
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.wardrobe} onChange={e => setPreProd('planning', 'wardrobe', e.target.checked)} className={checkCls} /> Wardrobe Styling
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.props} onChange={e => setPreProd('planning', 'props', e.target.checked)} className={checkCls} /> Props Sourcing
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.schedule} onChange={e => setPreProd('planning', 'schedule', e.target.checked)} className={checkCls} /> Prod. Schedule
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.pre_production.planning.callsheet} onChange={e => setPreProd('planning', 'callsheet', e.target.checked)} className={checkCls} /> Call Sheet Prep.
                            </label>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 3. Production ── */}
            <SectionCard title="3. Production Scope (Filming)" icon={<Camera className="w-4 h-4" />}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">A. Shoot Duration</label>
                        <MultiCheckbox options={SHOOT_DURATIONS} selected={config.production.shoot_duration} onChange={v => setProd('shoot_duration', v)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">B. Crew Size</label>
                        <MultiCheckbox options={CREW_SIZES} selected={config.production.crew_size} onChange={v => setProd('crew_size', v)} />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">C. Equipment Scope</h4>
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Camera Type Level</label>
                            <select value={config.production.equipment.camera_level} onChange={e => setProdSub('equipment', 'camera_level', e.target.value)} className={inputCls}>
                                {CAMERA_LEVELS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.production.equipment.lighting} onChange={e => setProdSub('equipment', 'lighting', e.target.checked)} className={checkCls} /> Lighting Setup
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.production.equipment.audio} onChange={e => setProdSub('equipment', 'audio', e.target.checked)} className={checkCls} /> Audio Recording
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.production.equipment.drone} onChange={e => setProdSub('equipment', 'drone', e.target.checked)} className={checkCls} /> Drone Footage
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.production.equipment.gimbal} onChange={e => setProdSub('equipment', 'gimbal', e.target.checked)} className={checkCls} /> Gimbal Stabilization
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.production.equipment.multi_cam} onChange={e => setProdSub('equipment', 'multi_cam', e.target.checked)} className={checkCls} /> Multi-camera Setup
                            </label>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">D. Location Type</h4>
                        <div className="mb-4">
                            <MultiCheckbox options={LOCATION_TYPES} selected={config.production.location.types} onChange={v => setProdSub('location', 'types', v)} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-2">
                                <input type="checkbox" checked={config.production.location.travel_included} onChange={e => setProdSub('location', 'travel_included', e.target.checked)} className={checkCls} /> Travel Included?
                            </label>
                            {config.production.location.travel_included && (
                                <div className="flex-1">
                                    <input type="text" value={config.production.location.travel_limit} onChange={e => setProdSub('location', 'travel_limit', e.target.value)} placeholder="Limit e.g. Max 50 miles from HQ" className={inputCls} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 4. Post-Production ── */}
            <SectionCard title="4. Post-Production (Editing)" icon={<Scissors className="w-4 h-4" />}>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Main Videos</label>
                            <input type="number" min="0" value={config.post_production.final_videos.main_count} onChange={e => setPostSub('final_videos', 'main_count', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Short Cuts</label>
                            <input type="number" min="0" value={config.post_production.final_videos.short_cuts} onChange={e => setPostSub('final_videos', 'short_cuts', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Reels/Shorts</label>
                            <input type="number" min="0" value={config.post_production.final_videos.reels} onChange={e => setPostSub('final_videos', 'reels', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Teasers</label>
                            <input type="number" min="0" value={config.post_production.final_videos.teasers} onChange={e => setPostSub('final_videos', 'teasers', parseInt(e.target.value))} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Video Length</label>
                        <MultiCheckbox options={VIDEO_LENGTHS} selected={config.post_production.lengths} onChange={v => setPost('lengths', v)} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Editing Level</label>
                        <select value={config.post_production.editing_level} onChange={e => setPost('editing_level', e.target.value)} className={inputCls}>
                            {EDITING_LEVELS.map(L => <option key={L}>{L}</option>)}
                        </select>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">Add-ons</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.motion_graphics} onChange={e => setPostSub('addons', 'motion_graphics', e.target.checked)} className={checkCls} /> Motion Graphics
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.text_overlays} onChange={e => setPostSub('addons', 'text_overlays', e.target.checked)} className={checkCls} /> Text Overlays
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.subtitles} onChange={e => setPostSub('addons', 'subtitles', e.target.checked)} className={checkCls} /> Subtitles / Captions
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.voiceover} onChange={e => setPostSub('addons', 'voiceover', e.target.checked)} className={checkCls} /> Voiceover Recording
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.music_licensing} onChange={e => setPostSub('addons', 'music_licensing', e.target.checked)} className={checkCls} /> Background Music
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.sound_design} onChange={e => setPostSub('addons', 'sound_design', e.target.checked)} className={checkCls} /> Sound Design
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.intro_outro} onChange={e => setPostSub('addons', 'intro_outro', e.target.checked)} className={checkCls} /> Intro/Outro Anim.
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.post_production.addons.logo_animation} onChange={e => setPostSub('addons', 'logo_animation', e.target.checked)} className={checkCls} /> Logo Animation
                            </label>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 5. Revisions ── */}
            <SectionCard title="5. Revisions Policy" icon={<RefreshCcw className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Revision Rounds</label>
                            <input type="number" min="0" value={config.revisions.rounds} onChange={e => setSub('revisions', 'rounds', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Revision Window</label>
                            <input type="text" value={config.revisions.window_days} onChange={e => setSub('revisions', 'window_days', e.target.value)} placeholder="e.g. within 5 days" className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">What qualifies as a revision?</label>
                            <textarea rows={2} value={config.revisions.what_counts} onChange={e => setSub('revisions', 'what_counts', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">What qualifies as a re-edit?</label>
                            <textarea rows={2} value={config.revisions.redesign_definition} onChange={e => setSub('revisions', 'redesign_definition', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Additional revision cost</label>
                        <input type="text" value={config.revisions.additional_cost} onChange={e => setSub('revisions', 'additional_cost', e.target.value)} className={inputCls} />
                    </div>
                </div>
            </SectionCard>

            {/* ── 6. Responsibility ── */}
            <SectionCard title="6. Content & Asset Responsibility" icon={<FileText className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(config.responsibility).map(([key, val]) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{key.replace('_', ' ')}</label>
                            <select value={val} onChange={e => setSub('responsibility', key, e.target.value)} className={inputCls}>
                                {RESPONSIBILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* ── 7. Delivery ── */}
            <SectionCard title="7. Delivery Format & Export" icon={<Monitor className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Resolution</label>
                            <select value={config.delivery.resolution} onChange={e => setSub('delivery', 'resolution', e.target.value)} className={inputCls}>
                                {RESOLUTIONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">File Format</label>
                            <select value={config.delivery.file_format} onChange={e => setSub('delivery', 'file_format', e.target.value)} className={inputCls}>
                                {FILE_FORMATS.map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Aspect Ratios</label>
                        <MultiCheckbox options={ASPECT_RATIOS} selected={config.delivery.aspect_ratios} onChange={v => setSub('delivery', 'aspect_ratios', v)} />
                    </div>
                    <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.delivery.thumbnail_included} onChange={e => setSub('delivery', 'thumbnail_included', e.target.checked)} className={checkCls} /> Thumbnail included
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.delivery.raw_footage_included} onChange={e => setSub('delivery', 'raw_footage_included', e.target.checked)} className={checkCls} /> Raw footage included
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* ── 8. Usage Rights ── */}
            <SectionCard title="8. Usage Rights & Licensing" icon={<ShieldCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Usage Rights</label>
                        <MultiCheckbox options={USAGE_TYPES} selected={config.rights.usage_types} onChange={v => setSub('rights', 'usage_types', v)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Duration of Usage</label>
                            <input type="text" value={config.rights.duration} onChange={e => setSub('rights', 'duration', e.target.value)} placeholder="e.g. 1 Year, Perpetual" className={inputCls} />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.rights.music_license_included} onChange={e => setSub('rights', 'music_license_included', e.target.checked)} className={checkCls} /> Music License Included
                            </label>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 9. Timeline ── */}
            <SectionCard title="9. Timeline Structure" icon={<CalendarCheck className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={TIMELINE_PHASES} selected={config.timeline} onChange={v => setTop('timeline', v)} />
                <p className="text-xs text-gray-400 mt-2">Timeframes will be finalized on the schedule.</p>
            </SectionCard>

            {/* ── 10. Event Coverage ── */}
            <SectionCard title="10. Event Coverage (If Applicable)" icon={<Film className="w-4 h-4" />} defaultOpen={false}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                    <input type="checkbox" checked={config.event.is_event} onChange={e => setSub('event', 'is_event', e.target.checked)} className={checkCls} />
                    This is an Event Coverage project
                </label>
                {config.event.is_event && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pl-4 border-l-2 border-gray-200 ml-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Hours of Coverage</label>
                            <input type="number" min="1" value={config.event.hours} onChange={e => setSub('event', 'hours', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Highlight Reel Length</label>
                            <input type="text" value={config.event.highlight_length} onChange={e => setSub('event', 'highlight_length', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Cameras</label>
                            <input type="number" min="1" value={config.event.cameras} onChange={e => setSub('event', 'cameras', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div className="col-span-2 flex gap-4 pt-1">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.event.same_day_edit} onChange={e => setSub('event', 'same_day_edit', e.target.checked)} className={checkCls} /> Same-day Edit
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.event.onsite_editor} onChange={e => setSub('event', 'onsite_editor', e.target.checked)} className={checkCls} /> On-site Editor
                            </label>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── 11. Retainer ── */}
            <SectionCard title="11. Ongoing Video Retainer" icon={<Repeat className="w-4 h-4" />} defaultOpen={false}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                    <input type="checkbox" checked={config.retainer.is_ongoing} onChange={e => setSub('retainer', 'is_ongoing', e.target.checked)} className={checkCls} />
                    This is an ongoing monthly video retainer
                </label>
                {config.retainer.is_ongoing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 ml-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Videos per Month</label>
                            <input type="number" min="1" value={config.retainer.videos_per_month} onChange={e => setSub('retainer', 'videos_per_month', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Shoot Days per Month</label>
                            <input type="number" min="0" value={config.retainer.shoot_days_per_month} onChange={e => setSub('retainer', 'shoot_days_per_month', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Editing Turnaround Time</label>
                            <input type="text" value={config.retainer.turnaround} onChange={e => setSub('retainer', 'turnaround', e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.retainer.content_batching} onChange={e => setSub('retainer', 'content_batching', e.target.checked)} className={checkCls} /> Content Batching?
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.retainer.rollover} onChange={e => setSub('retainer', 'rollover', e.target.checked)} className={checkCls} /> Rollover unused videos
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.retainer.priority_support} onChange={e => setSub('retainer', 'priority_support', e.target.checked)} className={checkCls} /> Priority Support
                            </label>
                        </div>
                    </div>
                )}
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
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
