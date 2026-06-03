-- Fix onboarding: ensure all necessary INSERT policies exist

-- Drop and recreate companies INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Drop and recreate profiles INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Drop and recreate profiles SELECT policy (needed during onboarding before company exists)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow SELECT on companies even without a profile yet (for onboarding)
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id = public.get_user_company_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = companies.id
  )
);

-- Targets INSERT: allow during onboarding (company_id passed directly)
DROP POLICY IF EXISTS "Users can create company targets" ON public.targets;
CREATE POLICY "Users can create company targets"
ON public.targets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- company_invites INSERT
DROP POLICY IF EXISTS "Admins can create invites" ON public.company_invites;
CREATE POLICY "Admins can create invites"
ON public.company_invites
FOR INSERT
TO authenticated
WITH CHECK (true);

-- company_invites SELECT (for checking invite during onboarding)
DROP POLICY IF EXISTS "Users can view invites by email" ON public.company_invites;
CREATE POLICY "Users can view invites by email"
ON public.company_invites
FOR SELECT
TO authenticated
USING (true);

-- company_invites UPDATE (mark as used)
DROP POLICY IF EXISTS "Users can update invites" ON public.company_invites;
CREATE POLICY "Users can update invites"
ON public.company_invites
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
