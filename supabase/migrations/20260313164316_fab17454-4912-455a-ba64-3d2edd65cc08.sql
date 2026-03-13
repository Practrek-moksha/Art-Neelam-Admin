
-- Update roll number format from ANA- to NAS-
CREATE OR REPLACE FUNCTION public.generate_roll_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.students
  WHERE roll_number LIKE 'NAS-%' OR roll_number LIKE 'ANA-%';
  NEW.roll_number := 'NAS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Add unique constraint on phone to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS students_whatsapp_unique ON public.students(whatsapp);

-- Add terms_accepted column for registration
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
