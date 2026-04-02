import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { getCompany } from '@/utils/getCompany';
import OrgDocumentsClient from '@/components/dashboard/documents/OrgDocumentsClient';

export default async function OrgDocumentsPage() {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) redirect('/login');

    const company = await getCompany(userData.user);

    if (!company) {
        if (userData.user.user_metadata?.role === 'manager') redirect('/onboarding');
        else redirect('/unauthorized');
    }

    const isManager = userData.user.user_metadata?.role === 'manager';
    let allowedOrgIds: string[] = [];

    // If staff, we must determine which organizations they belong to
    if (!isManager) {
        const adminSupabase = createAdminClient();
        const { data: staffRec } = await adminSupabase
            .from('staffs')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('company_id', company.id)
            .single();

        if (staffRec) {
            const { data: memberOrgs } = await adminSupabase
                .from('organization_members')
                .select('organization_id')
                .eq('staff_id', staffRec.id);
            allowedOrgIds = (memberOrgs || []).map((m: any) => m.organization_id);
        }

        const { data: generalOrg } = await adminSupabase
            .from('organizations')
            .select('id')
            .eq('company_id', company.id)
            .eq('name', 'General')
            .single();

        if (generalOrg && !allowedOrgIds.includes(generalOrg.id)) {
            allowedOrgIds.push(generalOrg.id);
        }
    }

    // Fetch Documents
    let docsQuery = supabase
        .from('organization_documents')
        .select(`
            id,
            file_name,
            file_url,
            file_type,
            file_size,
            category,
            created_at,
            uploaded_by,
            organization_id
        `)
        .eq('company_id', company.id);

    if (!isManager) {
        if (allowedOrgIds.length > 0) {
            docsQuery = docsQuery.in('organization_id', allowedOrgIds);
        } else {
            docsQuery = docsQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000');
        }
    }

    const { data: documents } = await docsQuery.order('created_at', { ascending: false });

    // Fetch Organizations for the sidebar/select logic 
    let orgsQuery = supabase
        .from('organizations')
        .select('id, name')
        .eq('company_id', company.id);

    if (!isManager) {
        if (allowedOrgIds.length > 0) {
            orgsQuery = orgsQuery.in('id', allowedOrgIds);
        } else {
            orgsQuery = orgsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
    }

    const { data: organizationsResponse } = await orgsQuery.order('name');

    // Make an array of staff information for uploader names if needed
    // In our payload we joined auth.users(email) for easy mapping

    return (
        <div className="w-full h-[calc(100vh-6rem)]">
            <OrgDocumentsClient
                initialDocuments={documents || []}
                organizations={organizationsResponse || []}
                currentUserId={userData.user.id}
            />
        </div>
    );
}
