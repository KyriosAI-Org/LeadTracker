-- Add new columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 10);
