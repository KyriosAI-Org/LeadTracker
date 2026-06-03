-- Create achievements table
CREATE TABLE public.achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name or URL
    requirement_type TEXT NOT NULL, -- 'calls', 'meetings', 'conversion', 'streak'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Create user_streaks table
CREATE TABLE public.user_streaks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Users can view their company achievements"
ON public.achievements FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE company_id = achievements.company_id
));

CREATE POLICY "Admins can manage company achievements"
ON public.achievements FOR ALL
USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE company_id = achievements.company_id AND role = 'admin'
));

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Policies for user_streaks
CREATE POLICY "Users can view their own streak"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

-- Update leads table to ensure tags is always an array
ALTER TABLE public.leads ALTER COLUMN tags SET DEFAULT '{}';

-- Function to update streaks
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    today DATE := CURRENT_DATE;
    last_date DATE;
    current_s INTEGER;
BEGIN
    SELECT last_activity_date, current_streak INTO last_date, current_s
    FROM public.user_streaks
    WHERE user_id = NEW.sdr_id;

    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, max_streak, last_activity_date)
        VALUES (NEW.sdr_id, 1, 1, today);
    ELSE
        IF last_date = today THEN
            -- Already updated today
            RETURN NEW;
        ELSIF last_date = today - INTERVAL '1 day' THEN
            -- Streak continues
            UPDATE public.user_streaks
            SET current_streak = current_streak + 1,
                max_streak = GREATEST(max_streak, current_streak + 1),
                last_activity_date = today,
                updated_at = now()
            WHERE user_id = NEW.sdr_id;
        ELSE
            -- Streak broken
            UPDATE public.user_streaks
            SET current_streak = 1,
                last_activity_date = today,
                updated_at = now()
            WHERE user_id = NEW.sdr_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for streaks
CREATE TRIGGER on_lead_created_update_streak
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_user_streak();

-- Default achievements for every company (Trigger or manual seed)
-- For now, let's create a function that an admin can call to setup default achievements
CREATE OR REPLACE FUNCTION public.setup_default_achievements(company_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.achievements (company_id, name, description, icon, requirement_type, requirement_value)
    VALUES 
    (company_uuid, 'Primeiro Passo', 'Registrou sua primeira call', 'Zap', 'calls', 1),
    (company_uuid, 'Iniciante Ativo', 'Completou 10 calls', 'Rocket', 'calls', 10),
    (company_uuid, 'Máquina de Vendas', 'Completou 100 calls', 'Trophy', 'calls', 100),
    (company_uuid, 'Mestre dos Agendamentos', 'Marcou 10 reuniões', 'Calendar', 'meetings', 10),
    (company_uuid, 'Fechador de Elite', 'Marcou 50 reuniões', 'Target', 'meetings', 50),
    (company_uuid, 'Constância de Ferro', 'Streak de 5 dias seguidos', 'Zap', 'streak', 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
