-- Remove the anonymous insert policy on leads
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
