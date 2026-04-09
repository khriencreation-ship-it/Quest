CREATE TABLE IF NOT EXISTS public.client_scope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The service being configured (e.g., Social Media, Graphics Design)
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    -- The specific project this scope belongs to
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    -- Dynamic scope data — fields vary per service type
    scope_config JSONB NOT NULL DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Each project can only have one scope per service
    UNIQUE(project_id, service_id)
);