'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, FileText, CheckSquare, Activity, Settings, Layers } from 'lucide-react';

import { updateProjectScope } from '@/app/actions/projects';
import SocialMediaScope from './scope/SocialMediaScope';
import FullStackScope from './scope/FullStackScope';
import GraphicsDesignScope from './scope/GraphicsDesignScope';
import UiUxScope from './scope/UiUxScope';
import VideoProductionScope from './scope/VideoProductionScope';
import WebsiteDevScope from './scope/WebsiteDevelopmentScope';

type ProjectDetailClientProps = {
    project: any;
    isSocialMedia: boolean;
    scopeConfig: any;
    serviceType?: string;
};

export default function ProjectDetailClient({ project, isSocialMedia, scopeConfig, serviceType }: ProjectDetailClientProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'documents', label: 'Documents', icon: FileText },
    ];

    if (scopeConfig) {
        tabs.push({ id: 'scope', label: 'Service Scope', icon: Layers });
    }

    if (isSocialMedia) {
        tabs.push({ id: 'calendar', label: 'Content Calendar', icon: CalendarIcon });
    }

    tabs.push({ id: 'settings', label: 'Settings', icon: Settings });

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar rounded-t-xl bg-white px-2 pt-2">
                <div className="flex space-x-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative rounded-t-lg
                                    ${isActive
                                        ? 'text-[#2eb781] bg-[#2eb781]/5'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <tab.icon className={`w-4 h-4 ${isActive ? 'text-[#2eb781]' : 'text-gray-400'}`} />
                                {tab.label}
                                {isActive && (
                                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2eb781] rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-xl rounded-tl-none border border-gray-100 shadow-sm p-6 min-h-[500px]">

                {activeTab === 'overview' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Project Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                                    <p className="text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        {project.description || 'No description provided for this project yet.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Start Date</h4>
                                        <p className="text-gray-900 font-medium">
                                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Target End Date</h4>
                                        <p className="text-gray-900 font-medium">
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                                <Activity className="w-8 h-8 text-gray-300 mb-3" />
                                <h3 className="font-semibold text-gray-900">No Activity Yet</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-[200px]">When tasks are completed, progress will appear here.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'scope' && scopeConfig && (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Project Service Scope</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Customize and save the specific scope configuration for this project.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl">
                            {serviceType === 'social_media' && (
                                <SocialMediaScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                />
                            )}
                            {serviceType === 'fullstack_dev' && (
                                <FullStackScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                />
                            )}
                            {serviceType === 'graphics_design' && (
                                <GraphicsDesignScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                />
                            )}
                            {serviceType === 'ui_ux_design' && (
                                <UiUxScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                />
                            )}
                            {serviceType === 'video_production' && (
                                <VideoProductionScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                />
                            )}
                            {serviceType === 'web_development' && (
                                <WebsiteDevScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                />
                            )}
                            {!['social_media', 'fullstack_dev', 'graphics_design', 'ui_ux_design', 'video_production', 'web_development'].includes(serviceType || '') && (
                                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                                        {JSON.stringify(scopeConfig, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && isSocialMedia && (
                    <div className="animate-in fade-in duration-300 h-full flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Content Calendar</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Generated automatically based on the `{project.services?.name}` scope rules.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                    <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></span> Posting
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                    <span className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300"></span> Reporting
                                </div>
                            </div>
                        </div>

                        {/* Render Calendar Matrix based on scopeConfig */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
                            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="p-3 text-center uppercase tracking-wider border-r border-gray-200 last:border-0">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 bg-gray-50/50 gap-px auto-rows-[120px]">
                                {Array.from({ length: 35 }).map((_, i) => {
                                    // A very naive mockup of 35 days (5 weeks)
                                    // Just to demonstrate plotting events by day of week
                                    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                                    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    const dayName = dayNames[i % 7];
                                    const fullDayName = fullDayNames[i % 7];
                                    const dateNum = i + 1; // fake date 1-35

                                    // Check posting schedule
                                    const postsToday = scopeConfig?.posting_schedule?.filter((s: any) => s.day === fullDayName) || [];

                                    // Check report day (naive)
                                    const reportFrequency = scopeConfig?.reporting?.frequency || 'Monthly';
                                    const reportDay = scopeConfig?.reporting?.report_day || 'Friday';
                                    const isReportDay = (reportFrequency === 'Weekly' && fullDayName === reportDay) ||
                                        (reportFrequency === 'Monthly' && fullDayName === reportDay && dateNum <= 31 && (
                                            (scopeConfig?.reporting?.week_of_month === '1st' && dateNum <= 7) ||
                                            (scopeConfig?.reporting?.week_of_month === '2nd' && dateNum > 7 && dateNum <= 14) ||
                                            (scopeConfig?.reporting?.week_of_month === '3rd' && dateNum > 14 && dateNum <= 21) ||
                                            ((!scopeConfig?.reporting?.week_of_month || scopeConfig?.reporting?.week_of_month === '4th') && dateNum > 21 && dateNum <= 28) ||
                                            (scopeConfig?.reporting?.week_of_month === 'Last' && dateNum + 7 > 31)
                                        ));

                                    // Ad runtime (just visual)
                                    const isAdRunning = scopeConfig?.ads?.enabled && i > 5 && i < 25;

                                    return (
                                        <div key={i} className="bg-white p-2 relative group hover:bg-gray-50 transition-colors">
                                            <span className={`text-xs font-semibold ${dateNum > 31 ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {dateNum > 31 ? dateNum - 31 : dateNum}
                                            </span>

                                            <div className="mt-1 space-y-1">
                                                {isAdRunning && (
                                                    <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400/20" title="Ads Running" />
                                                )}

                                                {postsToday.map((post: any, idx: number) => (
                                                    <div key={idx} className="space-y-1">
                                                        {post.content_types?.map((ct: string, ctIdx: number) => (
                                                            <div key={ctIdx} className="px-1.5 py-1 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-bold text-emerald-700 truncate" title="Format">
                                                                {ct.replace('_', ' ').toUpperCase()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}

                                                {isReportDay && (
                                                    <div className="px-1.5 py-1 bg-purple-50 border border-purple-100 rounded text-[10px] font-bold text-purple-700 truncate">
                                                        {reportFrequency.toUpperCase()} REPORT
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'tasks' || activeTab === 'documents' || activeTab === 'settings') && (
                    <div className="h-full flex items-center justify-center animate-in fade-in duration-300 py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                                {activeTab === 'tasks' && <CheckSquare className="w-8 h-8 text-gray-400" />}
                                {activeTab === 'documents' && <FileText className="w-8 h-8 text-gray-400" />}
                                {activeTab === 'settings' && <Settings className="w-8 h-8 text-gray-400" />}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 capitalize">{activeTab}</h3>
                            <p className="text-sm text-gray-500 mt-1">This section is currently under construction.</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
