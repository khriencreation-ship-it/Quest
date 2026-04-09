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

-- alter table to add company_id and status
ALTER TABLE public.client_scope 
ADD COLUMN IF NOT EXISTS company_id UUID 
REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.client_scope 
ADD COLUMN IF NOT EXISTS status TEXT 
CHECK (status IN ('active', 'inactive')) DEFAULT 'active';

-- RLS
ALTER TABLE public.client_scope ENABLE ROW LEVEL SECURITY;

-- Policies (access via projects → company_id → companies.owner_id)
CREATE POLICY "Company owners can view client scope" ON public.client_scope FOR SELECT USING (
    project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Company owners can insert client scope" ON public.client_scope FOR INSERT WITH CHECK (
    project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Company owners can update client scope" ON public.client_scope FOR UPDATE USING (
    project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
) WITH CHECK (
    project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
);

CREATE POLICY "Company owners can delete client scope" ON public.client_scope FOR DELETE USING (
    project_id IN (
        SELECT id FROM public.projects WHERE company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    )
);