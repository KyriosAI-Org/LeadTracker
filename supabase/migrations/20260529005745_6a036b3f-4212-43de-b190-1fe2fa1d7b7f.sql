-- Fix update_user_streak function
ALTER FUNCTION public.update_user_streak() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_user_streak() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_streak() TO service_role;

-- Fix setup_default_achievements function
ALTER FUNCTION public.setup_default_achievements(UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.setup_default_achievements(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_default_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_default_achievements(UUID) TO service_role;
