-- Assign admin role to admin@artneelam.academy user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@artneelam.academy'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also reset password for admin@artneelam.academy (handled via auth admin API, not SQL)
-- Ensure profile exists
INSERT INTO public.profiles (user_id, display_name)
SELECT id, 'Neelam Suthar' FROM auth.users WHERE email = 'admin@artneelam.academy'
ON CONFLICT (user_id) DO NOTHING;