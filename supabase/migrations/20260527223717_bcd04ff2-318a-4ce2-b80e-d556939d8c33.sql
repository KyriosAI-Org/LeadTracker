CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'not_scheduled')),
  rejection_reason TEXT
);

-- Use GRANT to set permissions for different roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (MVP focus)
CREATE POLICY "Allow public access" ON public.leads FOR ALL USING (true);
