-- Secure the handle_updated_at function by setting the search_path
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
