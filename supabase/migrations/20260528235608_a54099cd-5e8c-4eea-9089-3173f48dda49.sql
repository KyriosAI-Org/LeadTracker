-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions for companies
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Profiles extension to include company_id and role
CREATE TYPE public.user_role AS ENUM ('admin', 'sdr');

CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'admin',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update leads table to support multi-tenant and SDR assignment
ALTER TABLE public.leads 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN sdr_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create targets table
CREATE TABLE public.targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Optional: global or user-specific
  daily_calls_target INTEGER DEFAULT 50,
  weekly_meetings_target INTEGER DEFAULT 5,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.targets TO authenticated;
GRANT ALL ON public.targets TO service_role;

ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Users can view profiles in their company" 
ON public.profiles FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policies for Companies
CREATE POLICY "Users can view their own company" 
ON public.companies FOR SELECT 
USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for Leads (The core multi-tenant logic)
-- Dropping old policies if they exist (assuming simple ownership before)
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

CREATE POLICY "Admins can view all company leads" 
ON public.leads FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND company_id = leads.company_id AND role = 'admin'
  )
);

CREATE POLICY "SDRs can view their own leads" 
ON public.leads FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND sdr_id = auth.uid() AND role = 'sdr'
  )
);

CREATE POLICY "Users can insert leads for their company" 
ON public.leads FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND company_id = leads.company_id
  )
);

CREATE POLICY "SDRs can update their own leads" 
ON public.leads FOR UPDATE 
USING (sdr_id = auth.uid());

CREATE POLICY "Admins can update/delete any company lead" 
ON public.leads FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND company_id = leads.company_id AND role = 'admin'
  )
);

-- Targets policies
CREATE POLICY "Users can view company targets" 
ON public.targets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND company_id = targets.company_id
  )
);

-- Function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
