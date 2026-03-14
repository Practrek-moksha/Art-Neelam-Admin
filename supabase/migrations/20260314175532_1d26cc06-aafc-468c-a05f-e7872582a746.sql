-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload student photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'student-photos');

-- Allow public read access
CREATE POLICY "Public can view student photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'student-photos');

-- Allow authenticated users to update/delete
CREATE POLICY "Authenticated users can update student photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'student-photos');

CREATE POLICY "Authenticated users can delete student photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'student-photos');