'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, FileText, CheckSquare, Activity, Layers, Plus } from 'lucide-react';

import { updateProjectScope } from '@/app/actions/projects';

import SocialMediaScope from './scope/SocialMediaScope';
import FullStackScope from './scope/FullStackScope';
import GraphicsDesignScope from './scope/GraphicsDesignScope';
import UiUxScope from './scope/UiUxScope';
import VideoProductionScope from './scope/VideoProductionScope';
import WebsiteDevScope from './scope/WebsiteDevelopmentScope';
import GenericScope from './scope/GenericScope';
import ProjectTaskTab from './tasks-tabs/ProjectTaskTab';
import ProjectDocumentsTab from './documents-tab/ProjectDocumentsTab';
import ProjectReportsTab from './reports-tab/ProjectReportsTab';

type ProjectDetailClientProps = {
    project: any;
    isSocialMedia: boolean;
    scopeConfig: any;
    serviceType?: string;
    projectStaff?: any[];
};

export default function ProjectDetailClient({ project, isSocialMedia, scopeConfig, serviceType, projectStaff }: ProjectDetailClientProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'reports', label: 'Reports', icon: FileText },
    ];

    if (scopeConfig) {
        tabs.push({ id: 'scope', label: 'Service Scope', icon: Layers });
    }

    if (isSocialMedia) {
        tabs.push({ id: 'calendar', label: 'Content Calendar', icon: CalendarIcon });
    }

    // Process tasks into activity feed
    const activities = (() => {
        const tasks = project.tasks || [];
        const events: any[] = [];

        tasks.forEach((task: any) => {
            // Creation event
            events.push({
                id: `${task.id}-created`,
                type: 'created',
                date: new Date(task.created_at),
                taskTitle: task.title,
                actor: projectStaff?.find(s => s.user_id === task.created_by)?.full_name || 'System',
            });

            // Completion event
            if (task.status === 'done' && task.completed_at) {
                events.push({
                    id: `${task.id}-completed`,
                    type: 'completed',
                    date: new Date(task.completed_at),
                    taskTitle: task.title,
                    actor: 'Team', // We don't track the specific completer yet
                });
            }
        });

        return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    })();

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-xl px-2">
                <div className="flex overflow-x-auto hide-scrollbar pt-2">
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
            </div>
            {/* Tab Contents */}
            <div className={`bg-white rounded-xl border border-gray-100 shadow-sm min-h-[500px] ${activeTab === 'tasks' || activeTab === 'documents' ? 'p-0' : 'p-6'}`}>

                {activeTab === 'overview' && (
                    <div className="animate-in fade-in duration-300">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Project Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Project Description</h4>
                                    <p className="text-sm leading-relaxed text-gray-600 bg-gray-50/50 rounded-2xl p-5 border-2 border-gray-100">
                                        {project.description || 'No description provided for this project yet.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center">Start Date</h4>
                                        <p className="text-black font-bold text-center">
                                            {project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center">Target End Date</h4>
                                        <p className="text-black font-bold text-center">
                                            {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 border border-gray-100 rounded-2xl p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Recent Activity</h4>
                                {activities.length > 0 ? (
                                    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-gradient-to-b before:from-gray-100 before:via-gray-100 before:to-transparent">
                                        {activities.slice(0, 5).map((activity) => (
                                            <div key={activity.id} className="relative flex items-center justify-between group">
                                                <div className="flex items-center">
                                                    <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 z-10 transition-transform group-hover:scale-110 ${activity.type === 'completed'
                                                        ? 'bg-emerald-500 ring-emerald-100'
                                                        : 'bg-blue-500 ring-blue-100'
                                                        }`}>
                                                        {activity.type === 'completed' ? (
                                                            <CheckSquare className="w-3.5 h-3.5 text-white" />
                                                        ) : (
                                                            <Plus className="w-3.5 h-3.5 text-white" />
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {activity.type === 'completed' ? 'Task Completed' : 'Task Created'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            {activity.taskTitle}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                        {activity.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-[#2eb781]">
                                                        {activity.actor}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center p-10 bg-gray-50/30">
                                        <Activity className="w-10 h-10 text-gray-200 mb-4 animate-pulse" />
                                        <h3 className="font-bold text-gray-900">No Activity Yet</h3>
                                        <p className="text-sm text-gray-500 mt-1 max-w-[180px] leading-relaxed">
                                            Create and complete tasks to see your project's heartbeat here.
                                        </p>
                                    </div>
                                )}
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
                                <GenericScope
                                    initialConfig={scopeConfig}
                                    onClose={() => setActiveTab('overview')}
                                    onSave={async (config: any) => updateProjectScope(project.id, config)}
                                    readOnly={true}
                                />
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
                {activeTab === 'documents' && <ProjectDocumentsTab projectId={project.id} />}


                {activeTab === 'tasks' && <ProjectTaskTab projectId={project.id} />}

                {activeTab === 'reports' && <ProjectReportsTab projectId={project.id} />}

            </div>
        </div>
    );
}
