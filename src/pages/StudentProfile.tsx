import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, IdCard, Calendar, CreditCard, User, BookOpen, Clock, Send, Award } from "lucide-react";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [sRes, aRes, pRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase.from("attendance").select("*").eq("student_id", id).order("date", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", id).order("date", { ascending: false }),
      ]);
      setStudent(sRes.data);
      setAttendance(aRes.data || []);
      setPayments(pRes.data || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students" className="text-primary underline text-sm mt-2 inline-block">← Back to Students</Link>
      </div>
    );
  }

  const present = attendance.filter(a => a.status === "present").length;
  const late = attendance.filter(a => a.status === "late").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const totalMarked = attendance.length;
  const attendancePercent = totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0;
  const sessionsAttended = present + late;
  const sessionsRemaining = Math.max(0, student.total_sessions - sessionsAttended);
  const isEligibleForCert = sessionsAttended >= student.total_sessions;

  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum: number, p: any) => sum + p.amount, 0);
  const discountVal = student.discount_percent > 0
    ? Math.round(student.fee_amount * student.discount_percent / 100)
    : (student.discount_amount || 0);
  const finalFee = Math.max(0, student.fee_amount + discountVal); // fee_amount is already discounted if set during registration
  const feeProgress = student.fee_amount > 0 ? Math.round((totalPaid / student.fee_amount) * 100) : 0;

  const validityEnd = student.validity_end ? new Date(student.validity_end) : new Date();
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((validityEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Next due date: earliest pending payment
  const nextDue = payments.filter(p => p.status === "pending").sort((a, b) => a.date.localeCompare(b.date))[0];

  const courseColors: Record<string, string> = {
    Basic: "bg-accent text-accent-foreground",
    Advanced: "bg-secondary text-secondary-foreground",
    Professional: "bg-primary-soft text-primary",
  };

  const parentPhone = student.father_contact || student.mother_contact || student.whatsapp;
  const parentName = student.father_name || student.mother_name || "Parent";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/students" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"><ArrowLeft className="w-4 h-4 text-foreground" /></Link>
        <h1 className="font-display text-xl font-bold text-foreground">Student Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-2xl flex-shrink-0">{student.name[0]}</div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-lg">{student.name}</h2>
            <p className="text-xs text-muted-foreground font-body">{student.roll_number}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${courseColors[student.course] || ""}`}>{student.course}</span>
              <span className="text-[10px] text-muted-foreground font-body">{student.batch?.split(" (")[0]}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${student.status === "active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{student.status}</span>
              {isEligibleForCert && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Certificate Eligible
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <a href={`tel:${student.whatsapp}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-80 transition-opacity"><Phone className="w-3.5 h-3.5" /> Call</a>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.customMessage(student.name))} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-80 transition-opacity"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</button>
          <Link to={`/id-card?id=${student.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:opacity-80 transition-opacity"><IdCard className="w-3.5 h-3.5" /> ID Card</Link>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => openWhatsApp(parentPhone, templates.feeReminder(student.name, totalPending, nextDue?.date))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80"><Send className="w-3 h-3" /> Fee Reminder</button>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.birthdayWish(student.name))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-soft text-primary text-[10px] font-semibold hover:opacity-80"><Send className="w-3 h-3" /> Birthday Wish</button>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.welcomeStudent(student.name, student.course, student.batch))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:opacity-80"><Send className="w-3 h-3" /> Welcome Msg</button>
          {isEligibleForCert && (
            <Link to="/certificates" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-semibold hover:opacity-80"><Award className="w-3 h-3" /> Generate Certificate</Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={BookOpen} label="Sessions Left" value={String(sessionsRemaining)} sub={`${sessionsAttended} of ${student.total_sessions} done`} color="primary" />
        <StatCard icon={Calendar} label="Attendance" value={`${attendancePercent}%`} sub={`${present}P · ${late}L · ${absent}A`} color="accent" />
        <StatCard icon={CreditCard} label="Fees Paid" value={`₹${totalPaid.toLocaleString()}`} sub={`${feeProgress}% of ₹${student.fee_amount.toLocaleString()}`} color="secondary" />
        <StatCard icon={Clock} label="Validity" value={`${daysLeft}d`} sub={student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"} color={daysLeft < 30 ? "destructive" : "accent"} />
      </div>

      {/* Fee Progress Bar */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Fee Summary</h3>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, feeProgress)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-body">
          <div><span className="text-muted-foreground">Total Fee:</span> <span className="font-semibold text-foreground">₹{student.fee_amount.toLocaleString()}</span></div>
          {discountVal > 0 && <div><span className="text-muted-foreground">Discount:</span> <span className="font-semibold text-accent-foreground">₹{discountVal.toLocaleString()}</span></div>}
          <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold text-foreground">₹{totalPaid.toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Pending:</span> <span className="font-semibold text-destructive">₹{totalPending.toLocaleString()}</span></div>
          {nextDue && <div className="col-span-2"><span className="text-muted-foreground">Next Due:</span> <span className="font-semibold text-foreground">{new Date(nextDue.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span></div>}
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Personal Details</h3>
        <div className="space-y-2.5">
          <DetailRow label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
          <DetailRow label="School" value={student.school_name || "—"} />
          <DetailRow label="Address" value={student.address || "—"} />
          <DetailRow label="Email" value={student.email || "—"} />
          <DetailRow label="Emergency Contact" value={student.emergency_contact || "—"} />
          <DetailRow label="Payment Plan" value={student.payment_plan || "—"} />
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Parent / Guardian</h3>
        <div className="space-y-2.5">
          <DetailRow label="Father" value={student.father_name || "—"} sub={student.father_contact} />
          <DetailRow label="Mother" value={student.mother_name || "—"} sub={student.mother_contact} />
          {student.guardian_name && <DetailRow label="Guardian" value={student.guardian_name} />}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground font-body">₹{p.amount.toLocaleString()} · {p.method}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} · Instalment {p.installment_no}/{p.total_installments}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "paid" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Log */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4 mb-6">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Recent Attendance</h3>
        {attendance.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">No attendance recorded.</p>
        ) : (
          <div className="space-y-1.5">
            {attendance.slice(0, 10).map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-foreground font-body">{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  a.status === "present" ? "bg-accent text-accent-foreground" :
                  a.status === "late" ? "bg-secondary text-secondary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === "primary" ? "bg-primary-soft" : color === "accent" ? "bg-accent" : color === "destructive" ? "bg-destructive/10" : "bg-secondary"}`}>
          <Icon className={`w-4 h-4 ${color === "primary" ? "text-primary" : color === "accent" ? "text-accent-foreground" : color === "destructive" ? "text-destructive" : "text-secondary-foreground"}`} />
        </div>
      </div>
      <p className="font-display font-bold text-foreground text-lg">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{sub}</p>
    </div>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground font-body">{label}</span>
      <div className="text-right">
        <span className="text-xs font-semibold text-foreground font-body">{value}</span>
        {sub && <p className="text-[10px] text-muted-foreground font-body">{sub}</p>}
      </div>
    </div>
  );
}
