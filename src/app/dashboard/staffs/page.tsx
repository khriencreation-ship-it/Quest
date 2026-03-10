import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import StaffsClient from '@/components/dashboard/StaffsClient';

export default async function StaffsPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    // Fetch all staff for this company
    const { data: staffsRaw } = await supabase
        .from('staffs')
        .select('id, user_id, first_name, last_name, full_name, email, phone, role_id, contract_type, is_manager, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });

    // Normalise so is_manager is always a boolean
    const staffList = (staffsRaw || []).map(s => ({
        ...s,
        is_manager: s.is_manager ?? false,
    }));

    // The company owner (account creator) is always a manager but may not have a staffs row.
    // Prepend them as a synthetic entry if they're not already in the list.
    const ownerAlreadyInList = staffList.some(s => s.user_id === userData!.user.id);
    let staffs = staffList;

    if (!ownerAlreadyInList) {
        const ownerEmail = userData!.user.email || '';
        const ownerName = userData!.user.user_metadata?.full_name || ownerEmail.split('@')[0];
        const ownerEntry = {
            id: `owner-${userData!.user.id}`,
            user_id: userData!.user.id,
            first_name: ownerName.split(' ')[0] || ownerName,
            last_name: ownerName.split(' ').slice(1).join(' ') || null,
            full_name: ownerName,
            email: ownerEmail,
            phone: null,
            role_id: null,
            contract_type: 'full_time',
            is_manager: true,
            created_at: userData!.user.created_at,
            isOwner: true,         // flag so the UI can render it as read-only
        };
        staffs = [ownerEntry as any, ...staffList];
    }

    // Fetch all roles so we can populate the dropdown and display names
    const { data: roles } = await supabase
        .from('roles')
        .select('id, name')
        .eq('company_id', company.id)
        .order('name', { ascending: true });

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <StaffsClient
                staffs={staffs || []}
                roles={roles || []}
            />
        </div>
    );
}
