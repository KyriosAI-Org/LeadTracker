-- 1. Restrict get_user_company_id execution
REVOKE EXECUTE ON FUNCTION public.get_user_company_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(UUID) TO service_role;

-- 2. Ensure get_sdr_stats is only executable by authenticated users or service role
REVOKE EXECUTE ON FUNCTION public.get_sdr_stats(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sdr_stats(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sdr_stats(UUID, INTEGER) TO service_role;
