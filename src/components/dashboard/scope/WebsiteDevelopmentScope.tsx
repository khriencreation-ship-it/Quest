'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutTemplate, Layers, Palette, Database, FileText, Blocks,
    ShoppingCart, SearchCheck, Server, Zap, ShieldCheck, RefreshCcw,
    CalendarCheck, Wrench, FileCheck, ChevronDown, ChevronUp, Check, Loader2, X
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WebsiteDevConfig = {
    // 1. Website Type
    website_types: string[];
    custom_website_type: string;

    // 2. Scope Builder
    pages: {
        page_range: string;
        custom_page_count: number;
        page_definition: string;
        included_pages: string[];
        custom_pages: string[];
    };

    // 3. Design Scope
    design: {
        custom_ui: boolean;
        template_based: boolean;
        ui_ux_phase: boolean;
        responsive: boolean;
        animations: boolean;
        interactive: boolean;
    };

    // 4. CMS & Backend
    cms: {
        included: boolean;
        platform: string;
        admin_dashboard: boolean;
        blog_management: boolean;
        content_editing: boolean;
        role_access: boolean;
    };

    // 5. Content
    content: {
        copy: string;
        images: string;
        blog: string;
        legal: string;
    };

    // 6. Functional Features
    features: string[];

    // 7. E-commerce
    ecommerce: {
        enabled: boolean;
        product_count: number;
        payment_gateway: boolean;
        shipping: boolean;
        tax: boolean;
        coupons: boolean;
        inventory: boolean;
        categories: boolean;
        order_management: boolean;
    };

    // 8. SEO
    seo: {
        basic_seo: boolean;
        advanced_seo: boolean;
        keyword_research: boolean;
        blog_seo: boolean;
        perf_optimization: boolean;
    };

    // 9. Hosting & Deployment
    hosting: {
        included: boolean;
        domain_setup: boolean;
        ssl: boolean;
        email_setup: boolean;
        staging: boolean;
        provider: string;
        client_provided: boolean;
    };

    // 10. Performance
    performance: {
        page_speed: boolean;
        image_opt: boolean;
        caching: boolean;
        cdn: boolean;
        security_hardening: boolean;
    };

    // 11. Testing
    testing: {
        cross_browser: boolean;
        mobile: boolean;
        performance: boolean;
        bug_fix_window: string;
    };

    // 12. Revisions
    revisions: {
        design_rounds: number;
        dev_adjustments: number;
        scope_change_def: string;
        billing_process: string;
    };

    // 13. Timeline
    timeline: string[];

    // 14. Support
    support: {
        duration_days: number;
        bug_fixes: boolean;
        feature_updates: boolean;
        ongoing_package: boolean;
        backup_schedule: string;
        security_updates: boolean;
    };

    // 15. Ownership
    ownership: {
        client_owns: boolean;
        source_files: boolean;
        credentials_transfer: boolean;
        portfolio_usage: boolean;
    };
};

type Props = {
    serviceId?: string;
    onSave: (config: any) => Promise<{ error: string | null }>;
    initialConfig: Partial<WebsiteDevConfig>;
    onClose: () => void;
};


// ─── Constants ────────────────────────────────────────────────────────────────

const WEBSITE_TYPES = ['Corporate Website', 'Personal Portfolio', 'Landing Page', 'E-commerce Website', 'Blog Website', 'Educational Website', 'NGO Website', 'Membership Website', 'Web Application (Non-complex)', 'Redesign of Existing Website'];
const PAGE_RANGES = ['1–5 pages', '6–10 pages', '10+ pages', 'Custom page count'];
const INCLUDED_PAGES = ['Home', 'About', 'Services', 'Contact', 'Blog', 'Portfolio', 'FAQ', 'Case Studies', 'Team Page', 'Shop'];

const CMS_PLATFORMS = ['WordPress', 'Webflow', 'Custom CMS', 'Headless CMS', 'Shopify', 'Other'];
const CONTENT_PROVIDERS = ['Client provides', 'Khrien writes', 'Shared responsibility'];

const FEATURES = ['Contact Form', 'Newsletter integration', 'Payment integration', 'E-commerce checkout', 'Booking system', 'Membership login', 'Search functionality', 'Multi-language support', 'Live chat integration', 'CRM integration', 'Analytics setup', 'Social media integration', 'API integrations'];

const TIMELINE_PHASES = ['Planning & Structure', 'Design Phase', 'Development Phase', 'Review & Testing', 'Deployment'];
const BACKUP_SCHEDULES = ['Daily', 'Weekly', 'Monthly', 'None'];

// ─── Reusable Bits ────────────────────────────────────────────────────────────

const checkCls = 'w-4 h-4 accent-emerald-600 cursor-pointer rounded shrink-0';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-sm text-gray-900';

function SectionCard({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
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
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
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

export default function WebsiteDevelopmentScope({ serviceId, initialConfig, onClose, onSave }: Props) {
    const router = useRouter();

    const [config, setConfig] = useState<WebsiteDevConfig>({
        website_types: initialConfig.website_types || [],
        custom_website_type: initialConfig.custom_website_type || '',

        pages: {
            page_range: PAGE_RANGES[0],
            custom_page_count: 0,
            page_definition: 'A unique layout or template requiring specific design or development.',
            included_pages: [],
            custom_pages: [],
            ...(initialConfig.pages || {})
        },

        design: {
            custom_ui: true,
            template_based: false,
            ui_ux_phase: true,
            responsive: true,
            animations: false,
            interactive: false,
            ...(initialConfig.design || {})
        },

        cms: {
            included: true,
            platform: CMS_PLATFORMS[0],
            admin_dashboard: true,
            blog_management: false,
            content_editing: false,
            role_access: false,
            ...(initialConfig.cms || {})
        },

        content: {
            copy: CONTENT_PROVIDERS[0],
            images: CONTENT_PROVIDERS[0],
            blog: CONTENT_PROVIDERS[0],
            legal: CONTENT_PROVIDERS[0],
            ...(initialConfig.content || {})
        },

        features: initialConfig.features || [],

        ecommerce: {
            enabled: false,
            product_count: 10,
            payment_gateway: true,
            shipping: false,
            tax: false,
            coupons: false,
            inventory: true,
            categories: true,
            order_management: true,
            ...(initialConfig.ecommerce || {})
        },

        seo: {
            basic_seo: true,
            advanced_seo: false,
            keyword_research: false,
            blog_seo: false,
            perf_optimization: true,
            ...(initialConfig.seo || {})
        },

        hosting: {
            included: false,
            domain_setup: false,
            ssl: true,
            email_setup: false,
            staging: true,
            provider: 'AWS / Vercel',
            client_provided: true,
            ...(initialConfig.hosting || {})
        },

        performance: {
            page_speed: true,
            image_opt: true,
            caching: true,
            cdn: false,
            security_hardening: false,
            ...(initialConfig.performance || {})
        },

        testing: {
            cross_browser: true,
            mobile: true,
            performance: true,
            bug_fix_window: '14 days post-launch',
            ...(initialConfig.testing || {})
        },

        revisions: {
            design_rounds: 2,
            dev_adjustments: 2,
            scope_change_def: 'Any addition of new functionality, pages, or entire section redesigns not listed in this document.',
            billing_process: 'Change Requests billed at $X/hr or quoted separately.',
            ...(initialConfig.revisions || {})
        },

        timeline: initialConfig.timeline || TIMELINE_PHASES,

        support: {
            duration_days: 30,
            bug_fixes: true,
            feature_updates: false,
            ongoing_package: false,
            backup_schedule: BACKUP_SCHEDULES[1],
            security_updates: true,
            ...(initialConfig.support || {})
        },

        ownership: {
            client_owns: true,
            source_files: true,
            credentials_transfer: true,
            portfolio_usage: true,
            ...(initialConfig.ownership || {})
        }
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [customPageInput, setCustomPageInput] = useState('');

    // helpers
    function setTop<K extends keyof WebsiteDevConfig>(key: K, val: WebsiteDevConfig[K]) {
        setConfig(c => ({ ...c, [key]: val }));
        setSaved(false);
    }

    function setSub<K extends 'pages' | 'design' | 'cms' | 'content' | 'ecommerce' | 'seo' | 'hosting' | 'performance' | 'testing' | 'revisions' | 'support' | 'ownership'>(section: K, key: string, val: any) {
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

    // Dynamic calc
    const numSelectedPages = config.pages.included_pages.length + config.pages.custom_pages.length;

    return (
        <div className="space-y-4">

            {/* ── 1. Type ── */}
            <SectionCard title="1. Website Type Configuration" icon={<LayoutTemplate className="w-4 h-4" />}>
                <p className="text-sm text-gray-500 mb-3">Define the kind of website being built.</p>
                <MultiCheckbox options={WEBSITE_TYPES} selected={config.website_types} onChange={v => setTop('website_types', v)} />
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Custom Website Type</label>
                    <input type="text" value={config.custom_website_type} onChange={e => setTop('custom_website_type', e.target.value)} placeholder="e.g. Travel Booking Portal" className={inputCls} />
                </div>
            </SectionCard>

            {/* ── 2. Scope Builder (Pages) ── */}
            <SectionCard title="2. Website Scope Builder (Pages)" icon={<Layers className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-100">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Number of Pages Range</label>
                        <select value={config.pages.page_range} onChange={e => setSub('pages', 'page_range', e.target.value)} className={inputCls}>
                            {PAGE_RANGES.map(p => <option key={p}>{p}</option>)}
                        </select>
                        {config.pages.page_range === 'Custom page count' && (
                            <input type="number" min="1" value={config.pages.custom_page_count} onChange={e => setSub('pages', 'custom_page_count', parseInt(e.target.value))} placeholder="Count" className={`mt-2 ${inputCls}`} />
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">What qualifies as a page?</label>
                        <textarea rows={2} value={config.pages.page_definition} onChange={e => setSub('pages', 'page_definition', e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Page Structure Definition</label>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{numSelectedPages} Pages Total</span>
                    </div>
                    <MultiCheckbox options={INCLUDED_PAGES} selected={config.pages.included_pages} onChange={v => setSub('pages', 'included_pages', v)} />

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Custom Pages</label>
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                value={customPageInput}
                                onChange={e => setCustomPageInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && customPageInput.trim()) {
                                        e.preventDefault();
                                        setSub('pages', 'custom_pages', [...config.pages.custom_pages, customPageInput.trim()]);
                                        setCustomPageInput('');
                                    }
                                }}
                                placeholder="Add custom page..."
                                className={inputCls}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (customPageInput.trim()) {
                                        setSub('pages', 'custom_pages', [...config.pages.custom_pages, customPageInput.trim()]);
                                        setCustomPageInput('');
                                    }
                                }}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors shrink-0"
                            >
                                Add
                            </button>
                        </div>
                        {config.pages.custom_pages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {config.pages.custom_pages.map((cp, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {cp}
                                        <button type="button" onClick={() => setSub('pages', 'custom_pages', config.pages.custom_pages.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SectionCard>

            {/* ── 3. Design Scope ── */}
            <SectionCard title="3. Design Scope" icon={<Palette className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.design.custom_ui} onChange={e => setSub('design', 'custom_ui', e.target.checked)} className={checkCls} /> Custom UI Design
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.design.template_based} onChange={e => setSub('design', 'template_based', e.target.checked)} className={checkCls} /> Template-based build
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.design.ui_ux_phase} onChange={e => setSub('design', 'ui_ux_phase', e.target.checked)} className={checkCls} /> UI/UX Phase Included
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.design.responsive} onChange={e => setSub('design', 'responsive', e.target.checked)} className={checkCls} /> Responsive logic setup
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.design.animations} onChange={e => setSub('design', 'animations', e.target.checked)} className={checkCls} /> Animation effects
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={config.design.interactive} onChange={e => setSub('design', 'interactive', e.target.checked)} className={checkCls} /> Interactive components
                    </label>
                </div>
            </SectionCard>

            {/* ── 4. CMS & Backend ── */}
            <SectionCard title="4. CMS & Backend Configuration" icon={<Database className="w-4 h-4" />} defaultOpen={false}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                    <input type="checkbox" checked={config.cms.included} onChange={e => setSub('cms', 'included', e.target.checked)} className={checkCls} />
                    Content Management System (CMS) Included
                </label>
                {config.cms.included && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 ml-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">CMS Platform</label>
                            <select value={config.cms.platform} onChange={e => setSub('cms', 'platform', e.target.value)} className={inputCls}>
                                {CMS_PLATFORMS.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 col-span-1 sm:col-span-2 pt-2 border-t border-gray-100">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.cms.admin_dashboard} onChange={e => setSub('cms', 'admin_dashboard', e.target.checked)} className={checkCls} /> Admin Dashboard
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.cms.blog_management} onChange={e => setSub('cms', 'blog_management', e.target.checked)} className={checkCls} /> Blog Management Sync
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.cms.content_editing} onChange={e => setSub('cms', 'content_editing', e.target.checked)} className={checkCls} /> Visual Content Editing
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.cms.role_access} onChange={e => setSub('cms', 'role_access', e.target.checked)} className={checkCls} /> Role-based Access Rules
                            </label>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── 5. Content ── */}
            <SectionCard title="5. Content Responsibility" icon={<FileText className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Website Copy</label>
                        <select value={config.content.copy} onChange={e => setSub('content', 'copy', e.target.value)} className={inputCls}>
                            {CONTENT_PROVIDERS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Images</label>
                        <select value={config.content.images} onChange={e => setSub('content', 'images', e.target.value)} className={inputCls}>
                            {CONTENT_PROVIDERS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Blog Content</label>
                        <select value={config.content.blog} onChange={e => setSub('content', 'blog', e.target.value)} className={inputCls}>
                            {CONTENT_PROVIDERS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Legal Pages</label>
                        <select value={config.content.legal} onChange={e => setSub('content', 'legal', e.target.value)} className={inputCls}>
                            {CONTENT_PROVIDERS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </SectionCard>

            {/* ── 6. Features ── */}
            <SectionCard title="6. Functional Features" icon={<Blocks className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={FEATURES} selected={config.features} onChange={v => setTop('features', v)} />
            </SectionCard>

            {/* ── 7. E-commerce ── */}
            <SectionCard title="7. E-Commerce Module" icon={<ShoppingCart className="w-4 h-4" />} defaultOpen={false}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                    <input type="checkbox" checked={config.ecommerce.enabled} onChange={e => setSub('ecommerce', 'enabled', e.target.checked)} className={checkCls} />
                    Enable E-commerce Infrastructure
                </label>

                {config.ecommerce.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200 ml-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Number of Initial Products setup</label>
                            <input type="number" min="0" value={config.ecommerce.product_count} onChange={e => setSub('ecommerce', 'product_count', parseInt(e.target.value))} className={`${inputCls} max-w-[120px]`} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.ecommerce.payment_gateway} onChange={e => setSub('ecommerce', 'payment_gateway', e.target.checked)} className={checkCls} /> Payment Gateways
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.ecommerce.shipping} onChange={e => setSub('ecommerce', 'shipping', e.target.checked)} className={checkCls} /> Shipping Logic Setup
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.ecommerce.tax} onChange={e => setSub('ecommerce', 'tax', e.target.checked)} className={checkCls} /> Tax/VAT Computation
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.ecommerce.coupons} onChange={e => setSub('ecommerce', 'coupons', e.target.checked)} className={checkCls} /> Promocodes / Coupons
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.ecommerce.inventory} onChange={e => setSub('ecommerce', 'inventory', e.target.checked)} className={checkCls} /> Inventory Tracking Setup
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.ecommerce.categories} onChange={e => setSub('ecommerce', 'categories', e.target.checked)} className={checkCls} /> Product Categories
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer sm:col-span-2">
                                <input type="checkbox" checked={config.ecommerce.order_management} onChange={e => setSub('ecommerce', 'order_management', e.target.checked)} className={checkCls} /> Order Mgmt. Dashboard
                            </label>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── 8. SEO ── */}
            <SectionCard title="8. SEO Scope" icon={<SearchCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer mb-2">
                            <input type="checkbox" checked={config.seo.basic_seo} onChange={e => setSub('seo', 'basic_seo', e.target.checked)} className={checkCls} /> Basic SEO (Meta, Alt, Sitemap)
                        </label>
                        <p className="text-xs text-gray-500 pl-6">Essential tags and structure ensuring search engines can read the site.</p>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer mb-2">
                            <input type="checkbox" checked={config.seo.advanced_seo} onChange={e => setSub('seo', 'advanced_seo', e.target.checked)} className={checkCls} /> Advanced SEO Tactics
                        </label>
                        <div className="pl-6 space-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.seo.keyword_research} onChange={e => setSub('seo', 'keyword_research', e.target.checked)} className={checkCls} /> Keyword Research
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.seo.blog_seo} onChange={e => setSub('seo', 'blog_seo', e.target.checked)} className={checkCls} /> Blog Content SEO
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={config.seo.perf_optimization} onChange={e => setSub('seo', 'perf_optimization', e.target.checked)} className={checkCls} /> Deep Technical SEO
                            </label>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 9. Hosting ── */}
            <SectionCard title="9. Hosting & Deployment" icon={<Server className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div className="flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer">
                            <input type="checkbox" checked={config.hosting.included} onChange={e => setSub('hosting', 'included', e.target.checked)} className={checkCls} /> Hosting Included by Khrien
                        </label>
                        <span className="text-gray-300">|</span>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer">
                            <input type="checkbox" checked={config.hosting.client_provided} onChange={e => setSub('hosting', 'client_provided', e.target.checked)} className={checkCls} /> Client Provides Hosting
                        </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.hosting.domain_setup} onChange={e => setSub('hosting', 'domain_setup', e.target.checked)} className={checkCls} /> Domain DNS Setup
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.hosting.ssl} onChange={e => setSub('hosting', 'ssl', e.target.checked)} className={checkCls} /> SSL Certificate
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.hosting.email_setup} onChange={e => setSub('hosting', 'email_setup', e.target.checked)} className={checkCls} /> Business Email Config
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.hosting.staging} onChange={e => setSub('hosting', 'staging', e.target.checked)} className={checkCls} /> Prov. Staging Env.
                        </label>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Target Cloud / Hosting Provider</label>
                        <input type="text" value={config.hosting.provider} onChange={e => setSub('hosting', 'provider', e.target.value)} placeholder="e.g. AWS, Vercel, HostGator" className={inputCls} />
                    </div>
                </div>
            </SectionCard>

            {/* ── 10. Performance ── */}
            <SectionCard title="10. Performance & Optimization" icon={<Zap className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.performance.page_speed} onChange={e => setSub('performance', 'page_speed', e.target.checked)} className={checkCls} /> Page Speed Audit & Fix
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.performance.image_opt} onChange={e => setSub('performance', 'image_opt', e.target.checked)} className={checkCls} /> Image Payload Opt.
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.performance.caching} onChange={e => setSub('performance', 'caching', e.target.checked)} className={checkCls} /> Asset Caching Logic
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.performance.cdn} onChange={e => setSub('performance', 'cdn', e.target.checked)} className={checkCls} /> Global CDN Setup
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50 sm:col-span-2">
                        <input type="checkbox" checked={config.performance.security_hardening} onChange={e => setSub('performance', 'security_hardening', e.target.checked)} className={checkCls} /> DDOS & Security Hardening
                    </label>
                </div>
            </SectionCard>

            {/* ── 11. Testing ── */}
            <SectionCard title="11. Testing & QA" icon={<ShieldCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 border-b border-gray-100 pb-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.testing.cross_browser} onChange={e => setSub('testing', 'cross_browser', e.target.checked)} className={checkCls} /> Cross-browser Matrix Testing
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.testing.mobile} onChange={e => setSub('testing', 'mobile', e.target.checked)} className={checkCls} /> Specific Mobile Dev Testing
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.testing.performance} onChange={e => setSub('testing', 'performance', e.target.checked)} className={checkCls} /> Stress / Load Testing
                        </label>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Bug Fix Window</label>
                        <input type="text" value={config.testing.bug_fix_window} onChange={e => setSub('testing', 'bug_fix_window', e.target.value)} placeholder="e.g. 14 Days after Launch" className={inputCls} />
                    </div>
                </div>
            </SectionCard>

            {/* ── 12. Revisions ── */}
            <SectionCard title="12. Revision Structure" icon={<RefreshCcw className="w-4 h-4" />} defaultOpen={false}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Design Revision Rounds</label>
                            <input type="number" min="0" value={config.revisions.design_rounds} onChange={e => setSub('revisions', 'design_rounds', parseInt(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Dev Iteration Adjustments</label>
                            <input type="number" min="0" value={config.revisions.dev_adjustments} onChange={e => setSub('revisions', 'dev_adjustments', parseInt(e.target.value))} className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">What qualifies as a Scope Change?</label>
                            <textarea rows={2} value={config.revisions.scope_change_def} onChange={e => setSub('revisions', 'scope_change_def', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Change request billing procedure</label>
                            <textarea rows={2} value={config.revisions.billing_process} onChange={e => setSub('revisions', 'billing_process', e.target.value)} className={`${inputCls} resize-none`} />
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* ── 13. Timeline ── */}
            <SectionCard title="13. Timeline & Milestones" icon={<CalendarCheck className="w-4 h-4" />} defaultOpen={false}>
                <MultiCheckbox options={TIMELINE_PHASES} selected={config.timeline} onChange={v => setTop('timeline', v)} />
                <p className="text-xs text-gray-400 mt-2">Explicit delivery dates arrayed inside specific project charters.</p>
            </SectionCard>

            {/* ── 14. Support ── */}
            <SectionCard title="14. Maintenance & Post-Launch Support" icon={<Wrench className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Free Support Duration (Days)</label>
                        <input type="number" min="0" value={config.support.duration_days} onChange={e => setSub('support', 'duration_days', parseInt(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Backup Schedule (Database/Media)</label>
                        <select value={config.support.backup_schedule} onChange={e => setSub('support', 'backup_schedule', e.target.value)} className={inputCls}>
                            {BACKUP_SCHEDULES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1 sm:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.support.bug_fixes} onChange={e => setSub('support', 'bug_fixes', e.target.checked)} className={checkCls} /> Included Bug Fixes
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.support.feature_updates} onChange={e => setSub('support', 'feature_updates', e.target.checked)} className={checkCls} /> Free Feature Updates
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.support.security_updates} onChange={e => setSub('support', 'security_updates', e.target.checked)} className={checkCls} /> Security Patching
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={config.support.ongoing_package} onChange={e => setSub('support', 'ongoing_package', e.target.checked)} className={checkCls} /> Retainer Maintenance Package
                        </label>
                    </div>
                </div>
            </SectionCard>

            {/* ── 15. Ownership ── */}
            <SectionCard title="15. Ownership & Access Rights" icon={<FileCheck className="w-4 h-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.ownership.client_owns} onChange={e => setSub('ownership', 'client_owns', e.target.checked)} className={checkCls} /> Full Codebase Ownership -&gt; Client
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.ownership.source_files} onChange={e => setSub('ownership', 'source_files', e.target.checked)} className={checkCls} /> Handover Raw UI Source
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.ownership.credentials_transfer} onChange={e => setSub('ownership', 'credentials_transfer', e.target.checked)} className={checkCls} /> Total Admin Credentials Transfer
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={config.ownership.portfolio_usage} onChange={e => setSub('ownership', 'portfolio_usage', e.target.checked)} className={checkCls} /> Khrien Portfolio Advertising
                    </label>
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
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Scope'}
                    </button>
                </div>
            </div>
        </div>
    );
}
