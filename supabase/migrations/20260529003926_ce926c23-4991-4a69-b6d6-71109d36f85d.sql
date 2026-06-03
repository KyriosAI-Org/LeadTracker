
-- Tighten leads RLS: restrict to authenticated role explicitly
DROP POLICY IF EXISTS "Admins can update/delete any company lead" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all company leads" ON public.leads;
DROP POLICY IF EXISTS "SDRs can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "SDRs can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads for their company" ON public.leads;

CREATE POLICY "Admins manage company leads"
ON public.leads
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = leads.company_id AND p.role = 'admin'::user_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = leads.company_id AND p.role = 'admin'::user_role));

CREATE POLICY "SDRs view own or admin company leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  sdr_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = leads.company_id AND p.role = 'admin'::user_role)
);

CREATE POLICY "SDRs update own leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (sdr_id = auth.uid())
WITH CHECK (sdr_id = auth.uid());

CREATE POLICY "SDRs delete own leads"
ON public.leads
FOR DELETE
TO authenticated
USING (sdr_id = auth.uid());

CREATE POLICY "Users insert leads for their company"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = leads.company_id)
  AND (sdr_id = auth.uid() OR sdr_id IS NULL)
);

-- Also tighten other tables' policies to authenticated only
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view company targets" ON public.targets;
CREATE POLICY "Users can view company targets"
ON public.targets
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));
