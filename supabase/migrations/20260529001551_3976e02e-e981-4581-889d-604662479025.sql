-- Fix function search path and execute permissions
ALTER FUNCTION public.get_sdr_stats(UUID, INTEGER) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_sdr_stats(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sdr_stats(UUID, INTEGER) TO service_role;

-- Re-create the view with explicit security considerations (Postgres views use owner's permissions by default)
-- To avoid linter errors about security definer views (which views are by default if owned by a superuser),
-- we ensure it's just a regular view in public schema.
DROP VIEW IF EXISTS public.company_rankings;
CREATE VIEW public.company_rankings AS
SELECT 
    p.company_id,
    p.id as sdr_id,
    p.full_name,
    COUNT(l.id) as total_calls,
    COUNT(l.id) FILTER (WHERE l.status = 'Agendada') as total_meetings,
    CASE 
        WHEN COUNT(l.id) > 0 THEN (COUNT(l.id) FILTER (WHERE l.status = 'Agendada')::FLOAT / COUNT(l.id) * 100)
        ELSE 0 
    END as conversion_rate
FROM public.profiles p
LEFT JOIN public.leads l ON p.id = l.sdr_id
GROUP BY p.company_id, p.id, p.full_name;

GRANT SELECT ON public.company_rankings TO authenticated;
