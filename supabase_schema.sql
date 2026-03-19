-- Create Company Table
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS logic for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company" 
ON public.companies FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create a company" 
ON public.companies FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Create Organizations Table
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS logic for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orgs in their company" 
ON public.organizations FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert orgs to their company" 
ON public.organizations FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update orgs in their company"
ON public.organizations FOR UPDATE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete orgs in their company"
ON public.organizations FOR DELETE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

-- Create Roles Table
CREATE TABLE public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS logic for roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view roles in their company" 
ON public.roles FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert roles to their company" 
ON public.roles FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

-- Create Staffs Table (Master Company Directory)
CREATE TABLE public.staffs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable until they sign up
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, email)
);

-- Enable RLS for staffs
ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view staff in their company" 
ON public.staffs FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Company owners can manage staff" 
ON public.staffs FOR ALL
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE owner_id = auth.uid()
  )
);

-- Create Organization Members Table (Staff Workspace Mapping)
CREATE TABLE public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staffs(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, staff_id)
);

-- Enable RLS for organization members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Allow users to view members of their company's organizations
CREATE POLICY "Users can view members of their company orgs" 
ON public.organization_members FOR SELECT 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
);

-- Allow company owners to add members
CREATE POLICY "Company owners can manage members" 
ON public.organization_members FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
);

-- Allow company owners to delete members
CREATE POLICY "Company owners can remove members" 
ON public.organization_members FOR DELETE 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Services Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  scope_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, service_type)
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can view their services"
ON public.services FOR SELECT
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can insert services"
ON public.services FOR INSERT
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can update services"
ON public.services FOR UPDATE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()))
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can delete services"
ON public.services FOR DELETE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- Clients Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, lead
  notes TEXT,
  portal_token UUID DEFAULT gen_random_uuid(), -- Used for generating the secure client portal link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, email)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can view their clients"
ON public.clients FOR SELECT
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can insert clients"
ON public.clients FOR INSERT
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can update clients"
ON public.clients FOR UPDATE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()))
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can delete clients"
ON public.clients FOR DELETE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- Projects Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- planning, active, completed, on_hold, cancelled
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can view all projects"
ON public.projects FOR SELECT
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can insert projects"
ON public.projects FOR INSERT
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can update projects"
ON public.projects FOR UPDATE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()))
WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "Company owners can delete projects"
ON public.projects FOR DELETE
USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scope_config JSONB DEFAULT '{}';

-- Internal vs Client Projects migration
ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Company Credentials Table for Google OAuth and other integrations 
CREATE TABLE public.company_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    service_type TEXT NOT NULL, -- 'google'
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    UNIQUE(company_id, service_type)
);
-- GOOGLE INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  account_email TEXT NOT NULL,
  connected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, service_type)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_integrations_company_service
ON public.integrations (company_id, service_type);

-- Constraint
ALTER TABLE public.integrations
DROP CONSTRAINT IF EXISTS service_type_check;

ALTER TABLE public.integrations
ADD CONSTRAINT service_type_check
CHECK (service_type IN ('google'));

--------------------------------------------------
-- CLEAN UP OLD POLICIES (IMPORTANT)
--------------------------------------------------

DROP POLICY IF EXISTS "Company owners can view their integrations" ON public.integrations;
DROP POLICY IF EXISTS "Company owners can insert integrations" ON public.integrations;
DROP POLICY IF EXISTS "Company owners can update integrations" ON public.integrations;
DROP POLICY IF EXISTS "Company owners can delete integrations" ON public.integrations;
DROP POLICY IF EXISTS "Owner or connector can view" ON public.integrations;
DROP POLICY IF EXISTS "Owner or manager can insert integrations" ON public.integrations;

--------------------------------------------------
-- FINAL WORKING POLICIES
--------------------------------------------------

-- SELECT: owner OR person who connected it
CREATE POLICY "View integrations"
ON public.integrations
FOR SELECT
USING (
  auth.uid() = connected_by
  OR company_id IN (
    SELECT c.id FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
);

-- INSERT: owner OR OAuth connector (THIS FIXES YOUR ISSUE)
CREATE POLICY "Insert integrations"
ON public.integrations
FOR INSERT
WITH CHECK (
  auth.uid() = connected_by
  OR company_id IN (
    SELECT c.id FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
);

-- UPDATE: owner only
CREATE POLICY "Update integrations"
ON public.integrations
FOR UPDATE
USING (
  company_id IN (
    SELECT c.id FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT c.id FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
);

-- DELETE: owner only
CREATE POLICY "Delete integrations"
ON public.integrations
FOR DELETE
USING (
  company_id IN (
    SELECT c.id FROM public.companies c
    WHERE c.owner_id = auth.uid()
  )
);