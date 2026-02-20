
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'parent');

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dob DATE,
  school_name TEXT,
  address TEXT,
  emergency_contact TEXT,
  father_name TEXT,
  father_contact TEXT,
  mother_name TEXT,
  mother_contact TEXT,
  guardian_name TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT,
  course TEXT NOT NULL DEFAULT 'Basic',
  batch TEXT NOT NULL DEFAULT 'Morning A',
  enrollment_date DATE DEFAULT CURRENT_DATE,
  validity_start DATE DEFAULT CURRENT_DATE,
  validity_end DATE,
  total_sessions INTEGER NOT NULL DEFAULT 48,
  fee_amount INTEGER NOT NULL DEFAULT 12000,
  payment_plan TEXT DEFAULT 'Monthly',
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Student-Parent link
CREATE TABLE public.student_parent_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, parent_user_id)
);
ALTER TABLE public.student_parent_link ENABLE ROW LEVEL SECURITY;

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  course TEXT DEFAULT 'Basic',
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  batch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT DEFAULT 'UPI',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_no INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT DEFAULT 'UPI',
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Notices
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  audience TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer: is parent linked to student
CREATE OR REPLACE FUNCTION public.is_parent_of_student(_user_id UUID, _student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_parent_link
    WHERE parent_user_id = _user_id AND student_id = _student_id
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate roll number
CREATE OR REPLACE FUNCTION public.generate_roll_number()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER set_roll_number
  BEFORE INSERT ON public.students
  FOR EACH ROW
  WHEN (NEW.roll_number IS NULL OR NEW.roll_number = '')
  EXECUTE FUNCTION public.generate_roll_number();

-- RLS Policies

-- user_roles: only admins can manage, users can read own
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- students
CREATE POLICY "Admins manage students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view linked students" ON public.students FOR SELECT USING (public.is_parent_of_student(auth.uid(), id));

-- student_parent_link
CREATE POLICY "Admins manage links" ON public.student_parent_link FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view own links" ON public.student_parent_link FOR SELECT USING (auth.uid() = parent_user_id);

-- leads: admin only (external API uses service role via edge function)
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- attendance
CREATE POLICY "Admins manage attendance" ON public.attendance FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view linked attendance" ON public.attendance FOR SELECT USING (public.is_parent_of_student(auth.uid(), student_id));

-- payments
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view linked payments" ON public.payments FOR SELECT USING (public.is_parent_of_student(auth.uid(), student_id));

-- expenses: admin only
CREATE POLICY "Admins manage expenses" ON public.expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- notices
CREATE POLICY "Admins manage notices" ON public.notices FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view notices" ON public.notices FOR SELECT USING (public.has_role(auth.uid(), 'parent'));
