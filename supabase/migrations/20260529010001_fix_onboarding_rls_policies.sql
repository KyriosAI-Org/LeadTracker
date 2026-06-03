-- Allow authenticated users to complete onboarding by creating company, profile, and default targets

-- Companies: allow authenticated users to create their first company during onboarding
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Companies: allow users to update their own company after onboarding
CREATE POLICY "Users can update their own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (id = public.get_user_company_id(auth.uid()))
WITH CHECK (id = public.get_user_company_id(auth.uid()));

-- Profiles: allow users to create their profile row on first login
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Targets: allow authenticated users to create default targets for their company
CREATE POLICY "Users can create company targets"
ON public.targets
FOR INSERT
TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
