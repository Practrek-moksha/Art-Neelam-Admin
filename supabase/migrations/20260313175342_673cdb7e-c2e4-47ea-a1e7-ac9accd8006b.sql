-- Fix trigger to also handle 'TEMP' roll numbers
DROP TRIGGER IF EXISTS set_roll_number ON public.students;
CREATE TRIGGER set_roll_number
  BEFORE INSERT ON public.students
  FOR EACH ROW
  WHEN (NEW.roll_number IS NULL OR NEW.roll_number = '' OR NEW.roll_number = 'TEMP')
  EXECUTE FUNCTION generate_roll_number();

-- Fix any existing TEMP roll numbers
DO $$
DECLARE
  r RECORD;
  next_num INTEGER;
BEGIN
  FOR r IN SELECT id FROM public.students WHERE roll_number = 'TEMP' ORDER BY created_at
  LOOP
    SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num FROM public.students
    WHERE roll_number LIKE 'NAS-%';
    UPDATE public.students SET roll_number = 'NAS-' || LPAD(next_num::TEXT, 4, '0') WHERE id = r.id;
  END LOOP;
END $$;