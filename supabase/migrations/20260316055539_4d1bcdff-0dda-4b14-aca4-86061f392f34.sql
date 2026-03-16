
CREATE TABLE public.academy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage settings" ON public.academy_settings
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.academy_settings (key, value) VALUES
  ('academy_name', 'Art Neelam Academy'),
  ('address', ''),
  ('phone', '+91 99677 01108'),
  ('email', ''),
  ('website', 'artneelam.academy'),
  ('notifications_email', 'true'),
  ('notifications_whatsapp', 'true'),
  ('notifications_auto_followup', 'false'),
  ('notifications_birthday', 'true'),
  ('notifications_fee_reminder', 'true');
