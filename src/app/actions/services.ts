'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCompany } from '@/utils/getCompany';


const DEFAULT_SERVICES = [
    {
        name: 'Social Media Management',
        service_type: 'social_media',
        description: 'Full management of social media platforms including content creation, scheduling, engagement, and growth strategy.',
        scope_config: {
            platforms: [],
            content_types: [],
            posting_schedule: [],
            reporting: { frequency: 'weekly', report_day: 'Monday', formats: [] },
            ads: { enabled: false, platforms: [], notes: '' },
            extras: {
                community_management: false,
                hashtag_research: false,
                competitor_analysis: false,
                brand_monitoring: false,
                influencer_collab: false,
            },
        },
    },
    {
        name: 'Graphics Design Service',
        service_type: 'graphics_design',
        description: 'Professional graphic design including brand identity, marketing materials, and digital assets.',
        scope_config: {
            deliverable_types: [],
            file_formats: [],
            revision_rounds: 2,
            turnaround_days: 3,
            source_files_included: false,
            brand_guidelines_required: false,
        },
    },
    {
        name: 'Video Production & Editing',
        service_type: 'video_production',
        description: 'End-to-end video production including shooting, editing, motion graphics, and final delivery.',
        scope_config: {
            video_types: [],
            max_duration_minutes: null,
            resolution: '1080p',
            editing_style: [],
            deliverable_formats: [],
            raw_footage_included: false,
            subtitles_included: false,
            revision_rounds: 2,
        },
    },
    {
        name: 'UI/UX Design',
        service_type: 'ui_ux_design',
        description: 'User interface and experience design for web and mobile products.',
        scope_config: {
            design_tools: [],
            deliverable_types: [],
            prototype_fidelity: 'high',
            user_research_included: false,
            usability_testing: false,
            revision_rounds: 3,
            handoff_format: [],
        },
    },
    {
        name: 'Full Stack Development',
        service_type: 'fullstack_dev',
        description: 'Complete software development from frontend to backend, APIs, and database architecture.',
        scope_config: {
            frontend_stack: [],
            backend_stack: [],
            database: [],
            methodology: 'agile',
            hosting_setup: false,
            ci_cd: false,
            support_period_months: 1,
            documentation_included: true,
        },
    },
    {
        name: 'Website Development',
        service_type: 'web_development',
        description: 'Custom website development, WordPress, and e-commerce solutions.',
        scope_config: {
            platform: 'custom',
            number_of_pages: null,
            features: [],
            seo_included: false,
            maintenance_months: 0,
            responsive_design: true,
            cms_included: false,
            ecommerce: false,
        },
    },
];

export async function seedCompanyServices(companyId: string) {
    const supabase = await createClient();

    const rows = DEFAULT_SERVICES.map(s => ({
        company_id: companyId,
        ...s,
    }));

    // upsert so re-running is safe
    const { error } = await supabase
        .from('services')
        .upsert(rows, { onConflict: 'company_id,service_type', ignoreDuplicates: true });

    return error ? { error: error.message } : { success: true };
}

export async function updateServiceScope(serviceId: string, scopeConfig: object) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { error } = await supabase
        .from('services')
        .update({ scope_config: scopeConfig })
        .eq('id', serviceId);

    if (error) {
        console.error('Error updating service scope:', error);
        return { error: error.message };
    }

    revalidatePath('/dashboard/services');
    return { error: null };
}


export async function toggleService(serviceId: string, isActive: boolean) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const { error } = await supabase
        .from('services')
        .update({ is_active: isActive })
        .eq('id', serviceId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/services');
    return { success: true };
}

export async function createService(data: { name: string; description: string; service_type: string }) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.', service: null };

    const company = await getCompany(userData.user);
    if (!company) return { error: 'Company not found.', service: null };

    // Default scope config based on type
    const defaultMeta = DEFAULT_SERVICES.find(s => s.service_type === data.service_type);
    const scope_config = defaultMeta ? defaultMeta.scope_config : {};

    const { data: newService, error } = await supabase
        .from('services')
        .insert({
            company_id: company.id,
            name: data.name,
            description: data.description,
            service_type: data.service_type,
            scope_config,
            is_active: true
        })
        .select('id, name, description, service_type, scope_config, is_active, created_at')
        .single();

    if (error) return { error: error.message, service: null };

    revalidatePath('/dashboard/services');
    return { error: null, service: newService };
}

export async function deleteService(serviceId: string) {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return { error: 'Not authenticated.' };

    const company = await getCompany(userData.user);
    if (!company) return { error: 'Company not found.' };

    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('company_id', company.id);

    if (error) {
        console.error('Error deleting service:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/services');
    return { success: true };
}


