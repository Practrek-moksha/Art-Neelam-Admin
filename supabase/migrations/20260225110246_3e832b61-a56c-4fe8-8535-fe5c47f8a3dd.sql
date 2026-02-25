
-- 1. Change roll number prefix from NAS to ANA
CREATE OR REPLACE FUNCTION public.generate_roll_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(roll_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM public.students;
  NEW.roll_number := 'ANA-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

-- 2. Auto-assign admin role for super admin email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  -- Auto-assign admin role for super admin
  IF NEW.email = 'artneelam.paintings@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Add discount fields to students table
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS discount_amount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;
