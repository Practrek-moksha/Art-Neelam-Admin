import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, IdCard, Calendar, CreditCard, User, BookOpen, Clock, Send, Award, KeyRound, Loader2, Plus, X, FileText, Printer, Camera, Pencil, ArrowUpCircle, RefreshCw } from "lucide-react";
import { BATCHES } from "@/data/dummy";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

const PLAN_SPLITS: Record<string, number[]> = {
  "Full Payment": [1.0],
  "50-30-20 Installment": [0.5, 0.3, 0.2],
  "50-50 Custom": [0.5, 0.5],
};

type PaymentType = "full" | "part" | "installment";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showReenroll, setShowReenroll] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [sRes, aRes, pRes] = await Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("attendance").select("*").eq("student_id", id).order("date", { ascending: false }),
      supabase.from("payments").select("*").eq("student_id", id).order("date", { ascending: false }),
    ]);
    setStudent(sRes.data);
    setAttendance(aRes.data || []);
    setPayments(pRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

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

  const checkAndGraduate = async () => {
    // Re-fetch latest payments to check if all fees are paid
    const { data: latestPayments } = await supabase.from("payments").select("*").eq("student_id", id);
    const latestPaid = (latestPayments || []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);
    const allFeesPaid = latestPaid >= student.fee_amount;
    const allSessionsDone = sessionsAttended >= student.total_sessions;
    if (allFeesPaid && allSessionsDone && student.status !== "graduated") {
      await supabase.from("students").update({ status: "graduated" }).eq("id", id);
      toast.success(`🎓 ${student.name} has graduated! All sessions completed & fees paid.`);
    }
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum: number, p: any) => sum + p.amount, 0);
  const discountVal = student.discount_percent > 0
    ? Math.round(student.fee_amount * student.discount_percent / 100)
    : (student.discount_amount || 0);
  const feeProgress = student.fee_amount > 0 ? Math.round((totalPaid / student.fee_amount) * 100) : 0;
  const balanceDue = Math.max(0, student.fee_amount - totalPaid);

  const validityEnd = student.validity_end ? new Date(student.validity_end) : new Date();
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((validityEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const nextDue = payments.filter(p => p.status === "pending").sort((a: any, b: any) => a.date.localeCompare(b.date))[0];

  const courseColors: Record<string, string> = {
    Basic: "bg-accent text-accent-foreground",
    Advanced: "bg-secondary text-secondary-foreground",
    Professional: "bg-primary-soft text-primary",
  };

  const parentPhone = student.father_contact || student.mother_contact || student.whatsapp;
  const parentName = student.father_name || student.mother_name || "Parent";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center gap-3">
        <Link to="/students" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"><ArrowLeft className="w-4 h-4 text-foreground" /></Link>
        <h1 className="font-display text-xl font-bold text-foreground flex-1">Student Profile</h1>
        <button onClick={() => setShowEditForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:opacity-80 transition-opacity">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-2xl flex-shrink-0 overflow-hidden group cursor-pointer"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file"; input.accept = "image/*";
              input.onchange = async (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 1024 * 1024) { toast.error("Photo must be under 1MB"); return; }
                const ext = file.name.split(".").pop();
                const path = `${student.id}.${ext}`;
                const { error } = await supabase.storage.from("student-photos").upload(path, file, { upsert: true });
                if (error) { toast.error("Upload failed"); return; }
                const { data } = supabase.storage.from("student-photos").getPublicUrl(path);
                await supabase.from("students").update({ photo_url: data.publicUrl + "?t=" + Date.now() }).eq("id", student.id);
                toast.success("Photo updated!");
                fetchData();
              };
              input.click();
            }}>
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              student.name[0]
            )}
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-lg">{student.name}</h2>
            <p className="text-xs text-muted-foreground font-body">{student.roll_number}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${courseColors[student.course] || ""}`}>{student.course}</span>
              <span className="text-[10px] text-muted-foreground font-body">{student.batch?.split(" (")[0]}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${student.status === "active" ? "bg-accent text-accent-foreground" : student.status === "new" ? "bg-primary-soft text-primary" : student.status === "inactive" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{student.status}</span>
              {isEligibleForCert && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-warm text-warm-foreground flex items-center gap-1">
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
          <SendCredentialsButton student={student} />
          <button onClick={() => openWhatsApp(parentPhone, templates.feeReminder(student.name, totalPending, nextDue?.date))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80"><Send className="w-3 h-3" /> Fee Reminder</button>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.birthdayWish(student.name))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-soft text-primary text-[10px] font-semibold hover:opacity-80"><Send className="w-3 h-3" /> Birthday Wish</button>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.welcomeStudent(student.name, student.course, student.batch))} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:opacity-80"><Send className="w-3 h-3" /> Welcome Msg</button>
          {isEligibleForCert && (
            <Link to="/certificates" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80"><Award className="w-3 h-3" /> Generate Certificate</Link>
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

      {/* Fee Summary + Record Payment */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-foreground text-sm">Fee Summary</h3>
          <button onClick={() => setShowFeeForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 gradient-primary text-primary-foreground rounded-xl text-[10px] font-semibold shadow-active hover:opacity-90">
            <Plus className="w-3 h-3" /> Record Fee
          </button>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, feeProgress)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-body">
          <div><span className="text-muted-foreground">Total Fee:</span> <span className="font-semibold text-foreground">₹{student.fee_amount.toLocaleString()}</span></div>
          {discountVal > 0 && <div><span className="text-muted-foreground">Discount:</span> <span className="font-semibold text-accent-foreground">₹{discountVal.toLocaleString()}</span></div>}
          <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold text-foreground">₹{totalPaid.toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Balance Due:</span> <span className="font-semibold text-destructive">₹{balanceDue.toLocaleString()}</span></div>
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-foreground text-sm">Payment History</h3>
          {payments.length > 0 && (
            <Link to="/payments" className="text-[10px] text-primary font-semibold font-body hover:underline">View All →</Link>
          )}
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground font-body mb-2">No payments recorded yet.</p>
            <button onClick={() => setShowFeeForm(true)}
              className="text-xs text-primary font-semibold font-body hover:underline">
              + Record first payment
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground font-body">₹{p.amount.toLocaleString()} · {p.method}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} · Instalment {p.installment_no}/{p.total_installments}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "paid" ? "bg-accent text-accent-foreground" : p.status === "pending" ? "bg-warm text-warm-foreground" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                  {p.status === "pending" && (
                    <button onClick={async () => {
                      await supabase.from("payments").update({ status: "paid" }).eq("id", p.id);
                      toast.success("Marked as paid");
                      await checkAndGraduate();
                      fetchData();
                    }} className="text-[9px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-80">
                      ✓ Pay
                    </button>
                  )}
                  <button onClick={() => setShowInvoice(p)} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold hover:opacity-80">
                    <FileText className="w-3 h-3 inline" />
                  </button>
                </div>
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
                  a.status === "absent" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Fee Modal */}
      {showFeeForm && (
        <RecordFeeModal
          student={student}
          existingPayments={payments}
          onClose={() => setShowFeeForm(false)}
          onSaved={() => { setShowFeeForm(false); fetchData(); }}
        />
      )}

      {/* Edit Student Modal */}
      {showEditForm && (
        <EditStudentModal
          student={student}
          onClose={() => setShowEditForm(false)}
          onSaved={() => { setShowEditForm(false); fetchData(); }}
        />
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          payment={showInvoice}
          student={student}
          allPayments={payments}
          onClose={() => setShowInvoice(null)}
        />
      )}
    </div>
  );
}

function RecordFeeModal({ student, existingPayments, onClose, onSaved }: {
  student: any; existingPayments: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [paymentType, setPaymentType] = useState<PaymentType>("installment");
  const [form, setForm] = useState({
    amount: "", method: "UPI", installment_no: 1, total_installments: 1,
    notes: "", status: "paid", date: new Date().toISOString().slice(0, 10),
  });

  const totalPaid = existingPayments.filter(p => p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);
  const balanceDue = Math.max(0, student.fee_amount - totalPaid);
  const paidInstallments = existingPayments.filter(p => p.status === "paid").length;

  const plan = student.payment_plan || "50-30-20 Installment";
  const splits = PLAN_SPLITS[plan] || PLAN_SPLITS["50-30-20 Installment"];

  const getSchedule = () => {
    return splits.map((pct, i) => {
      const d = new Date(form.date);
      d.setMonth(d.getMonth() + i);
      return { no: i + 1, date: d.toISOString().slice(0, 10), amount: Math.round(student.fee_amount * pct), pct: Math.round(pct * 100) };
    });
  };

  useEffect(() => {
    if (paymentType === "full") {
      setForm(f => ({ ...f, amount: String(balanceDue), installment_no: 1, total_installments: 1, status: "paid" }));
    } else if (paymentType === "installment") {
      const schedule = getSchedule();
      const nextIdx = Math.min(paidInstallments, schedule.length - 1);
      setForm(f => ({
        ...f,
        amount: schedule[nextIdx] ? String(schedule[nextIdx].amount) : String(balanceDue),
        installment_no: nextIdx + 1,
        total_installments: schedule.length,
        status: "paid",
      }));
    } else {
      setForm(f => ({ ...f, status: "paid", installment_no: 1, total_installments: 1 }));
    }
  }, [paymentType]);

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    const { error } = await supabase.from("payments").insert({
      student_id: student.id, amount: Number(form.amount), method: form.method,
      date: form.date, installment_no: form.installment_no, total_installments: form.total_installments,
      notes: form.notes || null, status: form.status,
    });
    if (error) { toast.error("Failed: " + error.message); return; }

    // Auto-create pending future installments if first installment
    if (paymentType === "installment" && form.installment_no === 1 && paidInstallments === 0) {
      const schedule = getSchedule();
      for (let i = 1; i < schedule.length; i++) {
        await supabase.from("payments").insert({
          student_id: student.id, amount: schedule[i].amount, method: form.method,
          date: schedule[i].date, installment_no: i + 1, total_installments: schedule.length,
          notes: `Installment ${i + 1} (${schedule[i].pct}%)`, status: "pending",
        });
      }
    }

    toast.success("Payment recorded!");
    // Check graduation after recording payment
    const { data: latestPayments } = await supabase.from("payments").select("*").eq("student_id", student.id);
    const latestPaid = (latestPayments || []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);
    const { data: attData } = await supabase.from("attendance").select("status").eq("student_id", student.id);
    const sessionsAttended = (attData || []).filter((a: any) => a.status === "present" || a.status === "late").length;
    if (latestPaid >= student.fee_amount && sessionsAttended >= student.total_sessions && student.status !== "graduated") {
      await supabase.from("students").update({ status: "graduated" }).eq("id", student.id);
      toast.success(`🎓 ${student.name} has graduated!`);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-active animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Record Fee — {student.name}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Balance Summary */}
        <div className="bg-muted rounded-xl p-3 mb-4">
          <div className="grid grid-cols-3 gap-2 text-[10px] font-body">
            <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold text-foreground">₹{student.fee_amount.toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold text-accent-foreground">₹{totalPaid.toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Due:</span> <span className="font-semibold text-destructive">₹{balanceDue.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Payment Type */}
        <div className="flex gap-1.5 mb-4">
          {([
            { key: "full" as PaymentType, label: "💰 Full Balance" },
            { key: "installment" as PaymentType, label: "📅 Installment" },
            { key: "part" as PaymentType, label: "½ Custom" },
          ]).map(t => (
            <button key={t.key} onClick={() => setPaymentType(t.key)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all",
                paymentType === t.key ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground font-body">Amount (₹)*</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground font-body">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground font-body">Method</label>
              <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                {["UPI", "Cash", "Bank Transfer", "Cheque"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground font-body">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                {["paid", "pending"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Installment Schedule Preview */}
          {paymentType === "installment" && (
            <div className="bg-accent/30 rounded-xl p-3 border border-accent">
              <p className="text-xs font-bold text-foreground font-body mb-2">📅 Schedule ({plan})</p>
              {getSchedule().map(s => (
                <div key={s.no} className={cn("flex justify-between text-[11px] font-body py-1 border-b border-border/50 last:border-0",
                  s.no <= paidInstallments ? "opacity-50 line-through" : "")}>
                  <span className="text-foreground font-semibold">#{s.no} — {s.pct}%</span>
                  <span className="font-bold text-primary">₹{s.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Notes</label>
            <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Installment 2, Renewal..."
              className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90">
            Record ₹{form.amount ? Number(form.amount).toLocaleString() : "0"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStudentModal({ student, onClose, onSaved }: { student: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: student.name || "",
    course: student.course || "Basic",
    batch: student.batch || "Morning A",
    status: student.status || "active",
    dob: student.dob || "",
    school_name: student.school_name || "",
    address: student.address || "",
    email: student.email || "",
    whatsapp: student.whatsapp || "",
    emergency_contact: student.emergency_contact || "",
    father_name: student.father_name || "",
    father_contact: student.father_contact || "",
    mother_name: student.mother_name || "",
    mother_contact: student.mother_contact || "",
    guardian_name: student.guardian_name || "",
    fee_amount: student.fee_amount || 0,
    total_sessions: student.total_sessions || 48,
    payment_plan: student.payment_plan || "Monthly",
    discount_percent: student.discount_percent || 0,
    discount_amount: student.discount_amount || 0,
    validity_start: student.validity_start || "",
    validity_end: student.validity_end || "",
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.whatsapp.trim()) { toast.error("WhatsApp number is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("students").update({
      name: form.name.trim(),
      course: form.course,
      batch: form.batch,
      status: form.status,
      dob: form.dob || null,
      school_name: form.school_name || null,
      address: form.address || null,
      email: form.email || null,
      whatsapp: form.whatsapp,
      emergency_contact: form.emergency_contact || null,
      father_name: form.father_name || null,
      father_contact: form.father_contact || null,
      mother_name: form.mother_name || null,
      mother_contact: form.mother_contact || null,
      guardian_name: form.guardian_name || null,
      fee_amount: Math.max(0, Number(form.fee_amount)),
      total_sessions: Math.max(0, Number(form.total_sessions)),
      payment_plan: form.payment_plan,
      discount_percent: Math.max(0, Number(form.discount_percent)),
      discount_amount: Math.max(0, Number(form.discount_amount)),
      validity_start: form.validity_start || null,
      validity_end: form.validity_end || null,
    }).eq("id", student.id);
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Student updated!");
    onSaved();
  };

  const fieldClass = "w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelClass = "text-xs font-semibold text-muted-foreground font-body";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 shadow-active animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Edit Student</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Name *</label>
              <input type="text" value={form.name} onChange={e => update("name", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Course</label>
              <select value={form.course} onChange={e => update("course", e.target.value)} className={fieldClass}>
                {["Basic", "Advanced", "Professional"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Batch</label>
              <select value={form.batch} onChange={e => update("batch", e.target.value)} className={fieldClass}>
                {["Morning A (9–11 AM)", "Morning B (11–1 PM)", "Afternoon (2–4 PM)", "Evening (4–6 PM)", "Weekend (Sat 10–12)"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={e => update("status", e.target.value)} className={fieldClass}>
                {["new", "active", "inactive", "graduated"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => update("dob", e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>WhatsApp *</label>
              <input type="tel" value={form.whatsapp} onChange={e => update("whatsapp", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={e => update("email", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Emergency Contact</label>
              <input type="tel" value={form.emergency_contact} onChange={e => update("emergency_contact", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>School</label>
              <input type="text" value={form.school_name} onChange={e => update("school_name", e.target.value)} className={fieldClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Address</label>
              <input type="text" value={form.address} onChange={e => update("address", e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* Parents */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Father Name</label>
              <input type="text" value={form.father_name} onChange={e => update("father_name", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Father Contact</label>
              <input type="tel" value={form.father_contact} onChange={e => update("father_contact", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Mother Name</label>
              <input type="text" value={form.mother_name} onChange={e => update("mother_name", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Mother Contact</label>
              <input type="tel" value={form.mother_contact} onChange={e => update("mother_contact", e.target.value)} className={fieldClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Guardian Name</label>
              <input type="text" value={form.guardian_name} onChange={e => update("guardian_name", e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* Fee & Sessions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fee Amount (₹)</label>
              <input type="number" min="0" value={form.fee_amount} onChange={e => update("fee_amount", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Total Sessions</label>
              <input type="number" min="0" value={form.total_sessions} onChange={e => update("total_sessions", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Payment Plan</label>
              <select value={form.payment_plan} onChange={e => update("payment_plan", e.target.value)} className={fieldClass}>
                {["Full Payment", "50-30-20 Installment", "50-50 Custom", "Monthly"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Discount %</label>
              <input type="number" min="0" max="100" value={form.discount_percent} onChange={e => update("discount_percent", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Validity Start</label>
              <input type="date" value={form.validity_start} onChange={e => update("validity_start", e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Validity End</label>
              <input type="date" value={form.validity_end} onChange={e => update("validity_end", e.target.value)} className={fieldClass} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ payment, student, allPayments, onClose }: { payment: any; student: any; allPayments: any[]; onClose: () => void }) {
  const totalPaid = allPayments.filter(p => p.status === "paid").reduce((a: number, p: any) => a + p.amount, 0);
  const totalFee = student.fee_amount || 0;

  // Generate sequential invoice number INV-AN-001 based on paid payment order
  const paidPayments = allPayments.filter(p => p.status === "paid").sort((a: any, b: any) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
  const paymentIndex = paidPayments.findIndex(p => p.id === payment.id);
  const invoiceNum = paymentIndex >= 0 ? paymentIndex + 1 : allPayments.findIndex(p => p.id === payment.id) + 1;
  const invoiceId = `INV-AN-${String(invoiceNum).padStart(3, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md shadow-active animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 print:p-4" id="invoice-area">
          <div className="flex items-center justify-between mb-6 border-b-2 border-primary pb-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Art Neelam Academy" className="w-32 h-32 object-contain" />
              <div>
                <h2 className="font-display font-bold text-foreground text-lg">Art Neelam Academy</h2>
                <p className="text-[10px] text-muted-foreground font-body">Drawing & Painting Classes</p>
                <p className="text-[9px] text-muted-foreground font-body">📞 +91 99677 01108</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-foreground text-base">INVOICE</p>
              <p className="text-xs font-bold text-primary font-body">{invoiceId}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-1">
                {new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-wide">Billed To</p>
              <p className="text-sm font-bold text-foreground font-body">{student.name}</p>
              <p className="text-[10px] text-muted-foreground font-body">{student.roll_number}</p>
              <p className="text-[10px] text-muted-foreground font-body">{student.course} Course</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-wide">Payment Info</p>
              <p className="text-xs font-semibold text-foreground font-body">{payment.method}</p>
              <p className="text-[10px] text-muted-foreground font-body">Installment {payment.installment_no}/{payment.total_installments}</p>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden mb-4">
            <div className="gradient-primary text-primary-foreground px-4 py-2 flex justify-between text-xs font-body font-semibold">
              <span>Description</span><span>Amount</span>
            </div>
            <div className="bg-card">
              <div className="flex justify-between px-4 py-2.5 text-sm font-body border-b border-border">
                <span className="text-foreground font-semibold">{student.course} Course — Total Fee</span>
                <span className="font-semibold text-foreground">₹{totalFee.toLocaleString()}</span>
              </div>
              {allPayments.map(sp => (
                <div key={sp.id} className={cn("flex justify-between px-4 py-2 text-xs font-body border-b border-border/50", sp.id === payment.id ? "bg-primary-soft" : "")}>
                  <span className="text-muted-foreground">
                    {sp.notes || `Installment ${sp.installment_no}`}
                    <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${sp.status === "paid" ? "bg-accent text-accent-foreground" : "bg-warm text-warm-foreground"}`}>
                      {sp.status}
                    </span>
                  </span>
                  <span className="font-semibold text-foreground">₹{sp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 mb-4 space-y-1.5">
            <div className="flex justify-between text-xs font-body">
              <span className="text-muted-foreground">Total Fee</span>
              <span className="font-semibold text-foreground">₹{totalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-body">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-accent-foreground">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-body border-t border-border pt-1.5">
              <span className="font-semibold text-foreground">Pending Balance</span>
              <span className="font-bold text-destructive">₹{(totalFee - totalPaid).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between items-center gradient-primary text-primary-foreground rounded-xl px-4 py-3">
            <span className="text-sm font-semibold font-body">This Payment</span>
            <span className="font-display font-bold text-xl">₹{payment.amount.toLocaleString()}</span>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[9px] text-muted-foreground font-body">Thank you for choosing Art Neelam Academy</p>
            <p className="text-[9px] text-muted-foreground/50 font-body mt-1">This is a computer-generated invoice · {invoiceId}</p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-border print:hidden">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground font-body">Close</button>
          <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
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

function SendCredentialsButton({ student }: { student: any }) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-parent-account", {
        body: { student_id: student.id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setCredentials({ email: data.email, password: data.password });
      toast.success("Parent account created!");

      // Auto-open WhatsApp with credentials
      const parentPhone = student.father_contact || student.mother_contact || student.whatsapp;
      const portalUrl = `${window.location.origin}/auth`;
      openWhatsApp(
        parentPhone,
        templates.parentCredentials(
          data.parent_name, data.student_name, data.email, data.password, portalUrl
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to create parent account");
    } finally {
      setLoading(false);
    }
  };

  if (credentials) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-[10px] font-semibold">
        <KeyRound className="w-3 h-3" />
        <span>{credentials.email}</span>
        <button
          onClick={() => {
            const parentPhone = student.father_contact || student.mother_contact || student.whatsapp;
            const portalUrl = `${window.location.origin}/auth`;
            openWhatsApp(parentPhone, templates.parentCredentials(
              student.father_name || student.mother_name || "Parent",
              student.name, credentials.email, credentials.password, portalUrl
            ));
          }}
          className="ml-1 underline"
        >
          Resend
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-80 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
      {student.parent_account_created ? "Resend Credentials" : "Send Parent Login"}
    </button>
  );
}
