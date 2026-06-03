-- Remove the overly permissive public access policy
DROP POLICY IF EXISTS "Allow public access" ON public.leads;

-- The existing scoped policies already provide the necessary restricted access:
-- 1. "Admins can view all company leads" (SELECT)
-- 2. "Admins can update/delete any company lead" (ALL)
-- 3. "SDRs can view their own leads" (SELECT)
-- 4. "SDRs can update their own leads" (UPDATE)
-- 5. "Users can insert leads for their company" (INSERT)

-- These policies ensure that data is isolated by company and user role.
