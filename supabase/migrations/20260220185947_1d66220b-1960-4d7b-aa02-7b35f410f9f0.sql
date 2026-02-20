
CREATE OR REPLACE FUNCTION public.generate_roll_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.students;
  NEW.roll_number := 'NAS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
