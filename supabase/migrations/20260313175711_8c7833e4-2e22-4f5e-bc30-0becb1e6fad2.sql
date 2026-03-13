-- Link the demo parent to the demo student
INSERT INTO public.student_parent_link (parent_user_id, student_id)
VALUES ('f63c4011-2a78-49ec-b7cd-3fa8a771003b', '42adc897-3ed1-4d92-90cb-1cd3398f949a')
ON CONFLICT DO NOTHING;