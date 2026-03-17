import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import CompanySettingsForm from '@/components/dashboard/CompanySettingsForm';

export default async function SettingsPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        redirect('/login');
    }

    if (userData.user.user_metadata?.role !== 'manager') {
        redirect('/dashboard');
    }

    // Fetch the company
    const company = await getCompany(userData.user);

    if (!company) {
        redirect('/onboarding');
    }

    // Fetch full company details including description
    const { data: fullCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your company-wide preferences and identity.</p>
            </div>

            <CompanySettingsForm company={fullCompany} />
        </div>
    );
}
