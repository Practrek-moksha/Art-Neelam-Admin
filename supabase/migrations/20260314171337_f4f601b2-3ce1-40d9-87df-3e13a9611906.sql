
CREATE OR REPLACE FUNCTION public.generate_roll_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num FROM public.students
  WHERE roll_number LIKE 'AN-%';
  
  -- Also check old NAS format to not reuse numbers
  IF next_num <= (SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 5) AS INTEGER)), 0) FROM public.students WHERE roll_number LIKE 'NAS-%') THEN
    next_num := (SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 5) AS INTEGER)), 0) + 1 FROM public.students WHERE roll_number LIKE 'NAS-%');
  END IF;
  
  NEW.roll_number := 'AN-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;
