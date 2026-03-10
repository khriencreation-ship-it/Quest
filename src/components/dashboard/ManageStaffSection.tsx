'use client';

import { useState } from 'react';
import { Loader2, UserMinus, UserPlus, Shield } from 'lucide-react';
import { addStaffToOrganization, removeStaffFromOrganization } from '@/app/actions/organization_members';
import { useRouter } from 'next/navigation';

type StaffRecord = {
    id: string;
    full_name: string;
    email: string;
};

type Member = {
    id: string; // ID of the organization_members record
    staff_id: string;
    email?: string;
    full_name?: string;
    role?: string;
    created_at: string;
};

type Props = {
    organizationId: string;
    isGeneral: boolean;
    members: Member[];
    allStaff: StaffRecord[];
};

export default function ManageStaffSection({ organizationId, isGeneral, members, allStaff }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const router = useRouter();

    // Filter out staff who are already members
    const availableStaff = allStaff.filter(
        staff => !members.some(member => member.staff_id === staff.id)
    );

    async function handleAddStaff(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        if (!selectedStaffId) {
            setMessage({ type: 'error', text: 'Please select a staff member' });
            setIsLoading(false);
            return;
        }

        const result = await addStaffToOrganization(organizationId, selectedStaffId);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Staff member added successfully.' });
            setSelectedStaffId('');
            router.refresh();
        }
        setIsLoading(false);
    }

    async function handleRemoveStaff(memberId: string, name: string) {
        if (!confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
            return;
        }

        setIsLoading(true);
        const result = await removeStaffFromOrganization(organizationId, memberId);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Staff member removed.' });
            router.refresh();
        }
        setIsLoading(false);
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 sm:p-8 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Workspace Members</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isGeneral ? "Everyone in the company is automatically a member of the General workspace." : "Manage who has access to this organization."}
                        </p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mt-6 p-4 rounded-xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Only show the add staff form if it's NOT the general workspace */}
                {!isGeneral && (
                    <form onSubmit={handleAddStaff} className="mt-6 flex gap-3">
                        <select
                            required
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className={`flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all bg-gray-50 focus:bg-white text-sm ${!selectedStaffId ? 'text-gray-500' : 'text-gray-900'}`}
                        >
                            <option value="" disabled className="text-gray-900">Select a staff member...</option>
                            {availableStaff.map(staff => (
                                <option key={staff.id} value={staff.id} className="text-gray-900">
                                    {staff.full_name} ({staff.email})
                                </option>
                            ))}
                            {availableStaff.length === 0 && (
                                <option value="" disabled className="text-gray-900">All company staff are already in this workspace.</option>
                            )}
                        </select>
                        <button
                            type="submit"
                            disabled={isLoading || !selectedStaffId}
                            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2eb781] text-white font-semibold hover:bg-[#279e6f] transition-all disabled:opacity-50 text-sm shadow-sm cursor-pointer"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Add Member
                        </button>
                    </form>
                )}
            </div>

            <div className="divide-y divide-gray-100">
                {members.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No members found in this workspace. The owner has access by default.
                    </div>
                ) : (
                    members.map((member) => (
                        <div key={member.id} className="p-4 sm:px-8 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#2eb781]/10 flex items-center justify-center text-[#2eb781] font-bold shrink-0">
                                    {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{member.full_name || 'Unknown User'}</p>
                                    <p className="text-xs text-gray-500">{member.email}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Shield className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500 font-medium">{member.role || 'Member'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Do not show a remove button if it's the general org */}
                            {!isGeneral && (
                                <button
                                    onClick={() => handleRemoveStaff(member.id, member.full_name || 'User')}
                                    disabled={isLoading}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Remove Member"
                                >
                                    <UserMinus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
