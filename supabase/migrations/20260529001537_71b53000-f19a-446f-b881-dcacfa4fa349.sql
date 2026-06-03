-- Create user_role type if it doesn't exist (it might exist from previous context, but this is safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'sdr');
    END IF;
END $$;

-- Update profiles table structure
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'admin'::user_role;

-- Add user_id to targets for individual SDR goals
ALTER TABLE public.targets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create company_invites table for onboarding SDRs
CREATE TABLE IF NOT EXISTS public.company_invites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'sdr'::user_role,
    token TEXT NOT NULL UNIQUE,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Permissions for company_invites
GRANT SELECT, INSERT, DELETE ON public.company_invites TO authenticated;
GRANT ALL ON public.company_invites TO service_role;

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites" 
ON public.company_invites 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.company_id = company_invites.company_id 
        AND profiles.role = 'admin'::user_role
    )
);

-- Ranking aggregate view (for SDRs to see their position without seeing raw lead data)
CREATE OR REPLACE VIEW public.company_rankings AS
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

-- Ensure RLS on leads is strictly isolated
DROP POLICY IF EXISTS "SDRs can view their own leads" ON public.leads;
CREATE POLICY "SDRs can view their own leads" 
ON public.leads 
FOR SELECT 
TO authenticated 
USING (
    sdr_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.company_id = leads.company_id 
        AND profiles.role = 'admin'::user_role
    )
);

-- Function to handle weekly/daily targets logic
CREATE OR REPLACE FUNCTION public.get_sdr_stats(target_user_id UUID, days_ago INTEGER DEFAULT 7)
RETURNS TABLE (
    calls_count BIGINT,
    meetings_count BIGINT,
    avg_performance FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'Agendada'),
        AVG(performance_rating)::FLOAT
    FROM public.leads
    WHERE sdr_id = target_user_id
    AND created_at >= (now() - (days_ago || ' days')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
