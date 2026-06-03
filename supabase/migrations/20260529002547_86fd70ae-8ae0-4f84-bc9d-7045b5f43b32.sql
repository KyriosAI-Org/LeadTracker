-- 1. Create a security definer function to get the user's company_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = user_uuid;
$$;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- 3. Create a new, non-recursive policy using the helper function
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
);

-- 4. Grant execute on the new function
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO service_role;
