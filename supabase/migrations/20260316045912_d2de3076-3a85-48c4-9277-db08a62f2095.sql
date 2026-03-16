
-- Create registrations table for pending registration submissions
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dob date,
  school_name text,
  address text,
  emergency_contact text,
  father_name text,
  father_contact text,
  mother_name text,
  mother_contact text,
  guardian_name text,
  whatsapp text NOT NULL,
  email text,
  course text NOT NULL DEFAULT 'Basic',
  batch text NOT NULL DEFAULT 'Morning A',
  payment_plan text DEFAULT 'Full Payment',
  photo_url text,
  terms_accepted boolean DEFAULT false,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid,
  reviewed_at timestamptz,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage registrations"
ON public.registrations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert registrations"
ON public.registrations FOR INSERT TO anon
WITH CHECK (true);

-- Remove unique constraint on whatsapp if exists
DROP INDEX IF EXISTS students_whatsapp_key;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_whatsapp_key;
