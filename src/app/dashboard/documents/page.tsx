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

    const { data: documentsData, error: docsError } = await docsQuery.order('created_at', { ascending: false });

    if (docsError) {
        console.error('Error fetching documents:', docsError);
    }

    // Fetch uploader names for all documents
    const uploaderIds = [...new Set((documentsData || []).map(d => d.uploaded_by).filter(Boolean))];
    let uploaderMap: Record<string, string> = {};

    if (uploaderIds.length > 0) {
        try {
            const { data: staffData, error: staffError } = await supabase
                .from('staffs')
                .select('user_id, full_name')
                .in('user_id', uploaderIds);

            if (staffError) {
                console.error('Error fetching staff names:', staffError);
            } else if (staffData) {
                uploaderMap = Object.fromEntries(
                    staffData.map(s => [s.user_id, s.full_name])
                );
            }
        } catch (err) {
            console.error('Unexpected error fetching staff names:', err);
        }
    }

    const documentsWithNames = (documentsData || []).map(doc => ({
        ...doc,
        uploader_name: doc.uploaded_by ? uploaderMap[doc.uploaded_by] || 'Unknown' : 'Unknown',
    }));

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

    return (
        <div className="w-full h-[calc(100vh-6rem)]">
            <OrgDocumentsClient
                initialDocuments={documentsWithNames}
                organizations={organizationsResponse || []}
                currentUserId={userData.user.id}
            />
        </div>
    );
}
