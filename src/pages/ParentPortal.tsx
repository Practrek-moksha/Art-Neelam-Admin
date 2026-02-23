import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CalendarCheck, CreditCard, Bell, Cake, Shield, LogOut } from "lucide-react";

const today = new Date();

function getDaysUntilBirthday(dob: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface StudentData {
  id: string;
  name: string;
  roll_number: string;
  course: string;
  batch: string;
  dob: string | null;
  enrollment_date: string | null;
  validity_end: string | null;
}

export default function ParentPortal() {
  const { user, signOut, demoMode } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (demoMode) {
        // In demo mode, show all students
        const { data: studs } = await supabase.from("students").select("id, name, roll_number, course, batch, dob, enrollment_date, validity_end").eq("status", "active");
        setStudents(studs || []);
      } else {
        // Real auth: only linked students
        const { data: links } = await supabase.from("student_parent_link").select("student_id").eq("parent_user_id", user!.id);
        if (links && links.length > 0) {
          const ids = links.map(l => l.student_id);
          const { data: studs } = await supabase.from("students").select("id, name, roll_number, course, batch, dob, enrollment_date, validity_end").in("id", ids);
          setStudents(studs || []);
        }
      }

      // Load notices visible to parents
      const { data: noticeData } = await supabase.from("notices").select("*").in("audience", ["all", "parents"]).order("date", { ascending: false }).limit(10);
      setNotices(noticeData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load student-specific data when selection changes
  const student = students[selectedIdx];

  useEffect(() => {
    if (!student) return;
    const loadStudentData = async () => {
      const [attRes, payRes] = await Promise.all([
        supabase.from("attendance").select("*").eq("student_id", student.id),
        supabase.from("payments").select("*").eq("student_id", student.id).order("date", { ascending: false }),
      ]);
      setAttendance(attRes.data || []);
      setPayments(payRes.data || []);
    };
    loadStudentData();
  }, [student?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="font-display text-xl font-bold text-foreground">No Students Linked</h2>
        <p className="text-sm text-muted-foreground font-body">
          No students are linked to your account yet. Please contact the studio admin to link your child's profile.
        </p>
        <button onClick={signOut} className="text-sm text-primary font-semibold hover:underline">Sign Out</button>
      </div>
    );
  }

  const totalDays = [...new Set(attendance.map(r => r.date))].length;
  const presentDays = attendance.filter(r => r.status === "present").length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const daysUntilBday = student?.dob ? getDaysUntilBirthday(student.dob) : null;
  const totalPaid = payments.filter(p => p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((a: number, p: any) => a + p.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="gradient-hero rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-primary font-body">Parent Portal</span>
          </div>
          {!demoMode && (
            <button onClick={signOut} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Hello, Parent! 👋</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Track your child's progress at Art Neelam Studio</p>
      </div>

      {/* Student Selector */}
      {students.length > 1 && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground font-body">Select Student</label>
          <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
            {students.map((s, i) => <option key={s.id} value={i}>{s.name} ({s.roll_number})</option>)}
          </select>
        </div>
      )}

      {/* Student Card */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-2xl">
            {student.name[0]}
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground font-body">{student.roll_number} • {student.course}</p>
            <p className="text-xs text-muted-foreground font-body">{student.batch} batch</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground font-body">Enrolled</p>
            <p className="text-sm font-bold font-body text-foreground">
              {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-body">Valid Till</p>
            <p className="text-sm font-bold font-body text-foreground">
              {student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl shadow-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-accent-vivid" />
            <p className="text-xs font-semibold text-muted-foreground font-body">Attendance</p>
          </div>
          <div className="relative w-16 h-16 mx-auto">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--accent-vivid))" strokeWidth="6"
                strokeDasharray={`${(attendancePct / 100) * 163.4} 163.4`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold font-body text-foreground">{attendancePct}%</span>
            </div>
          </div>
          <p className={`text-center text-xs font-semibold font-body mt-2 ${attendancePct >= 75 ? "text-accent-vivid" : "text-destructive"}`}>
            {attendancePct >= 75 ? "Good" : "Needs Improvement"}
          </p>
        </div>

        {daysUntilBday !== null && (
          <div className="bg-warm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cake className="w-4 h-4 text-warm-foreground" />
              <p className="text-xs font-semibold text-warm-foreground font-body">Birthday</p>
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{daysUntilBday}</p>
            <p className="text-xs text-warm-foreground font-body">days to go 🎂</p>
            <p className="text-[10px] text-muted-foreground font-body mt-2">
              {new Date(student.dob!).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
            </p>
          </div>
        )}
      </div>

      {/* Fee Status */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-foreground text-base">Fee Status</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-xs text-accent-foreground font-body font-semibold">Paid</p>
              <p className="font-display font-bold text-foreground text-lg mt-1">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-warm rounded-xl p-3 text-center">
              <p className="text-xs text-warm-foreground font-body font-semibold">Pending</p>
              <p className="font-display font-bold text-foreground text-lg mt-1">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
          {payments.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-2">No payment records yet</p>}
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground font-body">Installment {p.installment_no}/{p.total_installments}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{p.method} • {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground font-body">₹{p.amount.toLocaleString()}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "paid" ? "bg-accent text-accent-foreground" : "bg-warm text-warm-foreground"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-foreground text-base">Notices</h3>
        </div>
        <div className="p-4 space-y-3">
          {notices.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-2">No notices</p>}
          {notices.map((n: any) => (
            <div key={n.id} className="p-3 bg-primary-soft rounded-xl">
              <p className="text-sm font-bold font-body text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{n.body}</p>
              <p className="text-[10px] text-primary font-semibold font-body mt-1.5">
                {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
