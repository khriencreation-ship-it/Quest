'use client';

import {
    Home,
    Calendar,
    FolderKanban,
    CheckSquare,
    Building2,
    Layers,
    UserCog,
    Users,
    FileText,
    Webhook,
    LogOut,
    Sparkles,
    Building,
    Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const companyMenus = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Clients', href: '/dashboard/clients', icon: Building2 },
    { name: 'Staffs', href: '/dashboard/staffs', icon: Users },
    { name: 'Roles', href: '/dashboard/roles', icon: UserCog },
    { name: 'Services', href: '/dashboard/services', icon: Layers },
    { name: 'Integrations', href: '/dashboard/integrations', icon: Webhook },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const organizationMenus = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
];

function getInitials(name: string) {
    return name.substring(0, 2).toUpperCase();
}

type Props = {
    company: { id: string; name: string };
    organizations: { id: string; name: string }[];
    isManager: boolean;
};

export default function DashboardSidebar({ company, organizations, isManager }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeOrgId = searchParams.get('org');

    const isCompanyActive = !activeOrgId;
    const activeMenus = isCompanyActive ? companyMenus : organizationMenus;
    const activeMenuTitle = isCompanyActive ? 'Company Navigation' : 'Organization Menu';

    return (
        <>
            {/* Far Left Sidebar (Workspace Switcher) */}
            <aside className="w-24 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 fixed inset-y-0 left-0 z-50 overflow-y-auto hidden md:flex">
                {/* Company Nav Item - Only visible to managers */}
                {isManager && (
                    <>
                        <Link href="/dashboard" className="flex flex-col items-center gap-2 w-full px-2 mb-6 group">
                            <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center text-lg font-bold shadow-sm transition-all cursor-pointer ${isCompanyActive ? 'bg-[#2eb781] scale-105' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 group-hover:scale-105'
                                }`}>
                                {getInitials(company.name)}
                            </div>
                            <span className={`text-[11px] font-medium text-center w-full truncate px-1 cursor-pointer transition-colors ${isCompanyActive ? 'text-[#2eb781]' : 'text-gray-400 group-hover:text-gray-200'
                                }`}>
                                {company.name}
                            </span>
                        </Link>
                        <div className="w-10 h-px bg-gray-800 mb-6" />
                    </>
                )}

                {/* Organizations List */}
                <div className="flex flex-col gap-6 w-full">
                    {organizations.map((org) => {
                        const isOrgActive = activeOrgId === org.id;
                        return (
                            <Link key={org.id} href={`/dashboard?org=${org.id}`} className="flex flex-col items-center gap-2 w-full px-2 group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm transition-all cursor-pointer ${isOrgActive ? 'bg-[#2eb781] text-white scale-105' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 group-hover:scale-105'
                                    }`}>
                                    {getInitials(org.name)}
                                </div>
                                <span className={`text-[11px]  font-medium text-center w-full truncate px-1 cursor-pointer transition-colors ${isOrgActive ? 'text-[#2eb781]' : 'text-gray-400 group-hover:text-gray-200'
                                    }`}>
                                    {org.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </aside>

            {/* Main Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 md:left-24 z-40">
                {/* Logo and Context Name */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
                    <div className="h-8 w-8 bg-[#2eb781] rounded-lg flex items-center justify-center shrink-0 md:hidden">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col truncate md:hidden">
                        <span className="text-sm font-bold text-gray-900 truncate">{company.name}</span>
                        <span className="text-xs text-gray-500 font-medium">Quest Workspace</span>
                    </div>
                    <div className="flex flex-col truncate hidden md:flex">
                        <span className="text-sm font-bold text-gray-900 truncate">Menu</span>
                        <span className="text-xs text-gray-500 font-medium">{activeMenuTitle}</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {activeMenus.map((item) => {
                        // Persist the org search param if we have one
                        const targetHref = activeOrgId ? `${item.href}?org=${activeOrgId}` : item.href;
                        const isActive = pathname === item.href;

                        // Wait, if the url has query params, pathname only matches the path part, which is correct for active state matching!
                        return (
                            <Link
                                key={item.name}
                                href={targetHref}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                    ? 'bg-[#2eb781]/10 text-[#2eb781]'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#2eb781]' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <LogOut className="w-5 h-5 text-gray-400" />
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
