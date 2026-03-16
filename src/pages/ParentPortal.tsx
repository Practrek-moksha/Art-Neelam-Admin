import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Shield, LogOut, IdCard, Award, FileText, X, Download, BookOpen, CalendarCheck, Cake, Clock } from "lucide-react";
import logoImg from "@/assets/logo.png";

const today = new Date();

function getDaysUntilBirthday(dob: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface StudentData {
  id: string; name: string; roll_number: string; course: string; batch: string;
  dob: string | null; enrollment_date: string | null; validity_end: string | null;
  validity_start: string | null; fee_amount: number; total_sessions: number;
  whatsapp: string; photo_url: string | null; status: string;
  father_name: string | null; mother_name: string | null;
  father_contact: string | null; mother_contact: string | null;
}

export default function ParentPortal() {
  const { user, signOut, demoMode } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [showIDCard, setShowIDCard] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "attendance" | "fees" | "id-card" | "certificate">("summary");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (demoMode) {
        const { data: studs } = await supabase.from("students")
          .select("id, name, roll_number, course, batch, dob, enrollment_date, validity_end, validity_start, fee_amount, total_sessions, whatsapp, photo_url, status, father_name, mother_name, father_contact, mother_contact")
          .in("status", ["active", "new", "graduated"]);
        setStudents(studs || []);
      } else {
        const { data: links } = await supabase.from("student_parent_link").select("student_id").eq("parent_user_id", user!.id);
        if (links && links.length > 0) {
          const ids = links.map(l => l.student_id);
          const { data: studs } = await supabase.from("students")
            .select("id, name, roll_number, course, batch, dob, enrollment_date, validity_end, validity_start, fee_amount, total_sessions, whatsapp, photo_url, status, father_name, mother_name, father_contact, mother_contact")
            .in("id", ids);
          setStudents(studs || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const student = students[selectedIdx];

  useEffect(() => {
    if (!student) return;
    const loadStudentData = async () => {
      const [attRes, payRes] = await Promise.all([
        supabase.from("attendance").select("*").eq("student_id", student.id).order("date", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", student.id).order("date", { ascending: false }),
      ]);
      setAttendance(attRes.data || []);
      setPayments(payRes.data || []);
    };
    loadStudentData();
  }, [student?.id]);

  const handlePrint = () => {
    window.print();
  };

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
        <p className="text-sm text-muted-foreground font-body">No students are linked to your account yet. Please contact the studio admin.</p>
        <button onClick={signOut} className="text-sm text-primary font-semibold hover:underline">Sign Out</button>
      </div>
    );
  }

  const presentDays = attendance.filter(r => r.status === "present").length;
  const sessionsRemaining = student ? Math.max(0, student.total_sessions - presentDays) : 0;
  const courseProgress = student ? Math.min(100, Math.round((presentDays / student.total_sessions) * 100)) : 0;
  const totalPaid = payments.filter(p => p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((a: number, p: any) => a + p.amount, 0);
  const feeProgress = student ? Math.round((totalPaid / student.fee_amount) * 100) : 0;
  const daysUntilBday = student?.dob ? getDaysUntilBirthday(student.dob) : null;
  const validityEnd = student?.validity_end ? new Date(student.validity_end) : null;
  const daysLeft = validityEnd ? Math.max(0, Math.ceil((validityEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const isGraduated = student?.status === "graduated";
  const canGetCertificate = isGraduated && totalPaid >= (student?.fee_amount || 0);

  const tabs = [
    { key: "summary" as const, label: "Summary", icon: BookOpen },
    { key: "attendance" as const, label: "Attendance", icon: CalendarCheck },
    { key: "fees" as const, label: "Fees", icon: CreditCard },
    { key: "id-card" as const, label: "ID Card", icon: IdCard },
    { key: "certificate" as const, label: "Certificate", icon: Award },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="gradient-hero rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <a href="https://nasdemo1.lovable.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="Art Neelam Academy" className="w-16 h-auto rounded-lg" />
            <span className="text-sm font-bold text-primary font-body">Parent Portal</span>
          </a>
          {!demoMode && (
            <button onClick={signOut} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Hello, Parent! 👋</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Track your child's progress at Art Neelam Academy</p>
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
          <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-2xl overflow-hidden">
            {student.photo_url ? <img src={student.photo_url} alt={student.name} className="w-full h-full rounded-2xl object-cover" /> : student.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground font-body">{student.roll_number} • {student.course}</p>
            <p className="text-xs text-muted-foreground font-body">{student.batch}</p>
            {isGraduated && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">🎓 Graduated</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted rounded-2xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold font-body transition-all ${
              activeTab === t.key ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== SUMMARY TAB ===== */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Course Progress */}
            <div className="bg-card rounded-2xl shadow-card border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-semibold text-muted-foreground font-body">Course Progress</p>
              </div>
              <div className="relative w-14 h-14 mx-auto">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="5"
                    strokeDasharray={`${(courseProgress / 100) * 138.2} 138.2`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold font-body text-foreground">{courseProgress}%</span>
                </div>
              </div>
              <p className="text-center text-[10px] text-muted-foreground font-body mt-1">{presentDays}/{student.total_sessions} sessions</p>
            </div>

            {/* Attendance */}
            <div className="bg-card rounded-2xl shadow-card border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-accent-vivid" />
                <p className="text-[10px] font-semibold text-muted-foreground font-body">Sessions Left</p>
              </div>
              <p className="font-display text-3xl font-bold text-foreground text-center">{sessionsRemaining}</p>
              <p className="text-center text-[10px] text-muted-foreground font-body mt-1">remaining</p>
            </div>

            {/* Fee Status */}
            <div className="bg-card rounded-2xl shadow-card border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-semibold text-muted-foreground font-body">Fees Paid</p>
              </div>
              <p className="font-display text-lg font-bold text-foreground">₹{totalPaid.toLocaleString()}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, feeProgress)}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1">of ₹{student.fee_amount.toLocaleString()}</p>
            </div>

            {/* Birthday or Validity */}
            {daysUntilBday !== null ? (
              <div className="bg-warm rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cake className="w-4 h-4 text-warm-foreground" />
                  <p className="text-[10px] font-semibold text-warm-foreground font-body">Birthday</p>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{daysUntilBday}</p>
                <p className="text-[10px] text-warm-foreground font-body">days to go 🎂</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-card border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-[10px] font-semibold text-muted-foreground font-body">Valid Till</p>
                </div>
                <p className="font-display text-lg font-bold text-foreground">
                  {student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </p>
                <p className={`text-[10px] font-body ${daysLeft < 30 ? "text-destructive" : "text-muted-foreground"}`}>{daysLeft} days left</p>
              </div>
            )}
          </div>

          {/* Enrollment Info */}
          <div className="bg-card rounded-2xl shadow-card border border-border p-4">
            <h3 className="font-display font-bold text-foreground text-sm mb-3">Enrollment Details</h3>
            <div className="space-y-2 text-xs font-body">
              <div className="flex justify-between"><span className="text-muted-foreground">Course</span><span className="font-semibold text-foreground">{student.course}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span className="font-semibold text-foreground">{student.batch}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Enrolled</span><span className="font-semibold text-foreground">{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Sessions</span><span className="font-semibold text-foreground">{student.total_sessions}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-foreground capitalize">{student.status}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ATTENDANCE TAB ===== */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl shadow-card border border-border p-4">
            <h3 className="font-display font-bold text-foreground text-sm mb-3">Attendance Log</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-accent rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-accent-foreground font-body font-semibold">Present</p>
                <p className="font-display font-bold text-foreground text-lg">{presentDays}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-destructive font-body font-semibold">Absent</p>
                <p className="font-display font-bold text-foreground text-lg">{attendance.filter(a => a.status === "absent").length}</p>
              </div>
              <div className="bg-muted rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground font-body font-semibold">Total</p>
                <p className="font-display font-bold text-foreground text-lg">{attendance.length}</p>
              </div>
            </div>
            {attendance.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body text-center py-4">No attendance recorded yet</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {attendance.slice(0, 30).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-foreground font-body">{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      a.status === "present" ? "bg-accent text-accent-foreground" :
                      a.status === "absent" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== FEES TAB ===== */}
      {activeTab === "fees" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl shadow-card border border-border p-4">
            <h3 className="font-display font-bold text-foreground text-sm mb-3">Fee Summary</h3>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, feeProgress)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground font-body font-semibold">Total</p>
                <p className="font-display font-bold text-foreground text-sm">₹{student.fee_amount.toLocaleString()}</p>
              </div>
              <div className="bg-accent rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-accent-foreground font-body font-semibold">Paid</p>
                <p className="font-display font-bold text-foreground text-sm">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-warm rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-warm-foreground font-body font-semibold">Pending</p>
                <p className="font-display font-bold text-foreground text-sm">₹{totalPending.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Pay Fee CTA */}
          {totalPending > 0 && (
            <div className="bg-primary-soft rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground font-body">Payment Due</p>
                  <p className="text-xs text-muted-foreground font-body">₹{totalPending.toLocaleString()} pending</p>
                </div>
              </div>
              <a
                href={`https://wa.me/919967701108?text=${encodeURIComponent(`Hi, I'd like to pay the pending fee of ₹${totalPending.toLocaleString()} for ${student.name} (${student.roll_number}). Please share payment details.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <CreditCard className="w-4 h-4" /> Pay Fee via WhatsApp
              </a>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-display font-bold text-foreground text-sm">Payment History</h3>
            </div>
            <div className="p-3 space-y-2">
              {payments.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-4">No payment records yet</p>}
              {payments.map((p: any) => (
                <div key={p.id} className="p-3 bg-muted rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground font-body">
                        Installment {p.installment_no}/{p.total_installments}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body">
                        {p.method} • {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground font-body">₹{p.amount.toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        p.status === "paid" ? "bg-accent text-accent-foreground" : "bg-warm text-warm-foreground"
                      }`}>{p.status}</span>
                    </div>
                  </div>
                  {p.status === "paid" && (
                    <button onClick={() => setShowInvoice(p)} className="mt-2 text-[10px] text-primary font-semibold hover:underline flex items-center gap-1">
                      <FileText className="w-3 h-3" /> View Invoice
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ID CARD TAB ===== */}
      {activeTab === "id-card" && (
        <div className="space-y-4">
          <div ref={printRef} className="bg-white rounded-2xl shadow-card border border-border overflow-hidden print-area" style={{ maxWidth: 340, margin: "0 auto" }}>
            {/* ID Card Front */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] p-4 text-white text-center">
              <img src={logoImg} alt="Art Neelam Academy" className="w-28 h-auto mx-auto mb-2" />
              <h3 className="font-display font-bold text-sm">Art Neelam Academy</h3>
              <p className="text-[9px] opacity-80">Student Identity Card</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-primary-soft mx-auto flex items-center justify-center font-display font-bold text-primary text-3xl overflow-hidden">
                {student.photo_url ? <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" /> : student.name[0]}
              </div>
              <div className="text-center">
                <h4 className="font-display font-bold text-foreground text-base">{student.name}</h4>
                <p className="text-xs text-muted-foreground font-body">{student.roll_number}</p>
              </div>
              <div className="space-y-1.5 text-xs font-body">
                <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Course</span><span className="font-semibold text-foreground">{student.course}</span></div>
                <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Batch</span><span className="font-semibold text-foreground">{student.batch}</span></div>
                <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">DOB</span><span className="font-semibold text-foreground">{student.dob ? new Date(student.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valid Till</span><span className="font-semibold text-foreground">{student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span></div>
              </div>
            </div>
            <div className="bg-[#1e3a5f] text-white text-center py-2">
              <p className="text-[9px]">📞 +91 99677 01108 • artneelam.com</p>
            </div>
          </div>
          <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
            <Download className="w-4 h-4" /> Download ID Card
          </button>
        </div>
      )}

      {/* ===== CERTIFICATE TAB ===== */}
      {activeTab === "certificate" && (
        <div className="space-y-4">
          {canGetCertificate ? (
            <>
              <div className="certificate-print-area bg-gradient-to-br from-[#fdf2f8] via-[#fce7f3] to-[#fbcfe8] rounded-2xl shadow-card border-2 border-[#f9a8d4] p-6 text-center" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as any}>
                <img src={logoImg} alt="Art Neelam Academy" className="w-32 h-auto mx-auto mb-3" />
                <p className="text-[10px] text-[#be185d] font-body uppercase tracking-widest">Certificate of Completion</p>
                <div className="my-4 border-t-2 border-b-2 border-[#f9a8d4] py-4">
                  <p className="text-xs text-[#9d174d] font-body">This is to certify that</p>
                  <h2 className="font-display text-2xl font-bold text-[#831843] mt-1">{student.name}</h2>
                  <p className="text-xs text-[#9d174d] font-body mt-1">Roll No: {student.roll_number}</p>
                </div>
                <p className="text-xs text-[#9d174d] font-body leading-relaxed">
                  has successfully completed the <strong className="text-[#831843]">{student.course}</strong> course
                  at Art Neelam Academy, having attended all <strong>{student.total_sessions}</strong> sessions.
                </p>
                <div className="mt-6 flex justify-between items-end px-4">
                  <div className="text-left">
                    <p className="text-[10px] text-[#9d174d] font-body">Date</p>
                    <p className="text-xs font-semibold text-[#831843] font-body">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#9d174d] font-body">Authorized Signature</p>
                    <p className="text-xs font-bold text-[#831843] font-display">Neelam Suthar</p>
                    <p className="text-[9px] text-[#9d174d]">Director, Art Neelam Academy</p>
                  </div>
                </div>
              </div>
              <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                <Download className="w-4 h-4" /> Download Certificate
              </button>
            </>
          ) : (
            <div className="bg-card rounded-2xl shadow-card border border-border p-6 text-center space-y-3">
              <Award className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="font-display font-bold text-foreground">Certificate Not Available</h3>
              <p className="text-xs text-muted-foreground font-body">
                Certificate will be available once all {student.total_sessions} sessions are completed and full fees are paid.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-body">Sessions</p>
                  <p className="font-display font-bold text-foreground">{presentDays}/{student.total_sessions}</p>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground font-body">Fees</p>
                  <p className="font-display font-bold text-foreground">₹{totalPaid.toLocaleString()}/₹{student.fee_amount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowInvoice(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-active animate-fade-in max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4 border-b-2 border-[#1e3a5f] pb-3">
                <div className="flex items-center gap-2">
                  <img src={logoImg} alt="Art Neelam" className="w-10 h-auto" />
                  <div>
                    <h2 className="font-display font-bold text-[#1e3a5f] text-sm">Art Neelam Academy</h2>
                    <p className="text-[9px] text-[#999] font-body">📞 +91 99677 01108</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-[#1e3a5f] text-xs">RECEIPT</p>
                  <p className="text-[9px] text-[#999] font-body">
                    {new Date(showInvoice.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs font-body">
                <div className="flex justify-between"><span className="text-[#666]">Student</span><span className="font-semibold text-[#1e3a5f]">{student.name}</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Roll No.</span><span className="font-semibold text-[#1e3a5f]">{student.roll_number}</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Course</span><span className="font-semibold text-[#1e3a5f]">{student.course}</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Installment</span><span className="font-semibold text-[#1e3a5f]">{showInvoice.installment_no}/{showInvoice.total_installments}</span></div>
                <div className="flex justify-between"><span className="text-[#666]">Method</span><span className="font-semibold text-[#1e3a5f]">{showInvoice.method}</span></div>
                <div className="flex justify-between border-t border-[#e5d5c0] pt-2 mt-2">
                  <span className="font-bold text-[#1e3a5f]">Amount Paid</span>
                  <span className="font-bold text-[#1e3a5f] text-base">₹{showInvoice.amount.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[8px] text-[#ccc] font-body text-center mt-4">Computer-generated receipt</p>
            </div>
            <div className="p-3 border-t border-border">
              <button onClick={() => setShowInvoice(null)} className="w-full py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground font-body">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
