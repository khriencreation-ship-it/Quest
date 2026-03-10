import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import CreateOrgModal from '@/components/dashboard/CreateOrgModal';
import { Building2, Users, FolderKanban } from 'lucide-react';
import Link from 'next/link';

export default async function OrganizationsPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect('/login');
    }

    // Fetch the company
    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Fetch organizations with member counts from organization_members
    const { data: organizations } = await supabase
        .from('organizations')
        .select('*, organization_members(count)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });

    // Count all staff in the company (for General org — everyone is a member)
    const { count: staffCount } = await supabase
        .from('staffs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id);

    // Check if the owner already has a staffs row (they might after editing their profile)
    const { count: ownerInStaffs } = await supabase
        .from('staffs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('user_id', userData.user.id);

    const ownerHasStaffRow = (ownerInStaffs ?? 0) > 0;
    // General = all staffs. If the owner has no staffs row yet, add 1 for them.
    const totalCompanyMembers = (staffCount ?? 0) + (ownerHasStaffRow ? 0 : 1);

    // Ensure General is at the top
    const orgList = (organizations || []).sort((a, b) => {
        if (a.name === 'General') return -1;
        if (b.name === 'General') return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-gray-500 mt-1">Manage all the active workspaces inside {company.name}.</p>
                </div>
                <CreateOrgModal />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgList.map((org) => {
                    const isGeneral = org.name === 'General';
                    // General = everyone in the company; others = explicit organization_members + 1 for the implicit owner
                    const memberCount = isGeneral
                        ? totalCompanyMembers
                        : ((org.organization_members as any)?.[0]?.count ?? 0) + 1;
                    return (
                        <div key={org.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden relative">
                            {/* Accent Line */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#2eb781] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm ${isGeneral ? 'bg-[#2eb781]/10 text-[#2eb781] border border-[#2eb781]/20' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}>
                                        {org.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                                        Workspace
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{org.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {isGeneral
                                        ? 'The default workspace shared across the entire company.'
                                        : (org.description || 'No description set for this workspace.')}
                                </p>

                                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 font-medium">Members</span>
                                        <div className="flex items-center gap-1.5 mt-1 text-gray-900 font-semibold">
                                            <Users className="w-4 h-4 text-[#2eb781]" />
                                            {memberCount}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 font-medium">Projects</span>
                                        <div className="flex items-center gap-1.5 mt-1 text-gray-900 font-semibold">
                                            <FolderKanban className="w-4 h-4 text-[#2eb781]" />
                                            --
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                                <Link
                                    href={`/dashboard/organizations/${org.id}`}
                                    className="text-sm font-semibold text-[#2eb781] group-hover:text-[#279e6f] flex items-center justify-center gap-2 w-full transition-colors"
                                >
                                    Manage Workspace
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">→</span>
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {/* Create New Card */}
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#2eb781]/50 hover:bg-[#2eb781]/5 transition-all flex flex-col items-center justify-center min-h-[320px] p-6 group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors shadow-sm border border-gray-100 group-hover:border-[#2eb781]/20">
                        <Building2 className="w-8 h-8 text-gray-400 group-hover:text-[#2eb781] transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">New Organization</h3>
                    <p className="text-sm text-gray-500 text-center max-w-[200px]">
                        Create a separate workspace for a new department, client branch, or team.
                    </p>
                    {/* Note: The modal is triggered by the button at the top, but we could make this card a trigger too. */}
                </div>
            </div>
        </div>
    );
}
