import { useState, useEffect } from "react";
import { Plus, Search, TrendingUp, X, Send, FileText, Trash2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

const statusColors: Record<string, string> = {
  paid: "bg-accent text-accent-foreground",
  pending: "bg-warm text-warm-foreground",
  partial: "bg-secondary text-secondary-foreground",
};

type PaymentRow = {
  id: string; student_id: string; amount: number; method: string | null;
  date: string; installment_no: number | null; total_installments: number | null;
  notes: string | null; status: string;
  students: { name: string; whatsapp: string; father_contact: string | null; mother_contact: string | null; roll_number: string; course: string; fee_amount: number; payment_plan: string | null } | null;
};

type StudentOption = {
  id: string; name: string; roll_number: string; whatsapp: string;
  father_contact: string | null; mother_contact: string | null;
  fee_amount: number; course: string; payment_plan: string | null;
};

type PaymentType = "full" | "part" | "installment" | "renewal" | "upgrade";

// Payment plan installment structures
const PLAN_SPLITS: Record<string, number[]> = {
  "Full Payment": [1.0],
  "50-30-20 Installment": [0.5, 0.3, 0.2],
  "50-50 Custom": [0.5, 0.5],
};

export default function Payments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [showInvoice, setShowInvoice] = useState<PaymentRow | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [form, setForm] = useState({
    student_id: "", amount: "", method: "UPI", installment_no: 1, total_installments: 1,
    notes: "", status: "paid", date: new Date().toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    const [pRes, sRes] = await Promise.all([
      supabase.from("payments").select("*, students(name, whatsapp, father_contact, mother_contact, roll_number, course, fee_amount, payment_plan)").order("date", { ascending: false }),
      supabase.from("students").select("id, name, roll_number, whatsapp, father_contact, mother_contact, fee_amount, course, payment_plan"),
    ]);
    if (pRes.error) toast.error("Failed to load payments");
    if (sRes.error) toast.error("Failed to load students");
    setPayments(pRes.data || []);
    const studentList = sRes.data || [];
    setStudents(studentList);
    if (studentList.length > 0 && !form.student_id) setForm(f => ({ ...f, student_id: studentList[0].id }));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = payments.filter(p =>
    (p.students?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = payments.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending" || p.status === "partial").reduce((a, p) => a + p.amount, 0);

  const selectedStudent = students.find(s => s.id === form.student_id);

  // 50/30/20 installment schedule
  const getInstallmentSchedule = () => {
    if (!selectedStudent) return [];
    const fee = selectedStudent.fee_amount;
    const plan = selectedStudent.payment_plan || "50-30-20 Installment";
    const splits = PLAN_SPLITS[plan] || PLAN_SPLITS["50-30-20 Installment"];
    const start = new Date(form.date);
    return splits.map((pct, i) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      return { no: i + 1, date: d.toISOString().slice(0, 10), amount: Math.round(fee * pct), pct: Math.round(pct * 100) };
    });
  };

  // Get student's payment summary
  const getStudentPaymentSummary = () => {
    if (!selectedStudent) return { paid: 0, pending: 0, total: 0 };
    const studentPayments = payments.filter(p => p.student_id === selectedStudent.id);
    const paid = studentPayments.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);
    const pending = studentPayments.filter(p => p.status === "pending").reduce((a, p) => a + p.amount, 0);
    return { paid, pending, total: selectedStudent.fee_amount };
  };

  useEffect(() => {
    if (paymentType === "full" && selectedStudent) {
      setForm(f => ({ ...f, amount: String(selectedStudent.fee_amount), installment_no: 1, total_installments: 1, status: "paid" }));
    } else if (paymentType === "installment" && selectedStudent) {
      const schedule = getInstallmentSchedule();
      const existingCount = payments.filter(p => p.student_id === form.student_id && p.status === "paid").length;
      const nextIdx = Math.min(existingCount, schedule.length - 1);
      setForm(f => ({
        ...f,
        amount: schedule.length > 0 ? String(schedule[nextIdx]?.amount || "") : "",
        installment_no: nextIdx + 1,
        total_installments: schedule.length,
        status: "paid",
      }));
    } else if (paymentType === "part") {
      setForm(f => ({ ...f, status: "partial", installment_no: 1, total_installments: 1 }));
    } else if (paymentType === "renewal" || paymentType === "upgrade") {
      setForm(f => ({ ...f, notes: paymentType === "renewal" ? "Course Renewal" : "Course Upgrade", status: "paid" }));
    }
  }, [paymentType, form.student_id]);

  const addPayment = async () => {
    if (!form.amount || !form.student_id) { toast.error("Student and amount required"); return; }
    const { error } = await supabase.from("payments").insert({
      student_id: form.student_id, amount: Number(form.amount), method: form.method,
      date: form.date, installment_no: form.installment_no, total_installments: form.total_installments,
      notes: form.notes || null, status: form.status,
    });
    if (error) { toast.error("Failed: " + error.message); return; }

    // Auto-create pending future installments
    if (paymentType === "installment" && form.installment_no === 1) {
      const schedule = getInstallmentSchedule();
      for (let i = 1; i < schedule.length; i++) {
        await supabase.from("payments").insert({
          student_id: form.student_id, amount: schedule[i].amount, method: form.method,
          date: schedule[i].date, installment_no: i + 1, total_installments: schedule.length,
          notes: `Installment ${i + 1} (${schedule[i].pct}%)`, status: "pending",
        });
      }
    }

    toast.success("Payment recorded!");
    setShowForm(false);
    setForm(f => ({ ...f, amount: "", notes: "" }));
    fetchData();
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from("payments").update({ status: "paid" }).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success("Marked as paid"); fetchData(); }
  };

  const deletePayment = async (id: string) => {
    if (!confirm("Delete this payment record?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); setPayments(prev => prev.filter(p => p.id !== id)); }
  };

  const sendReminderToParent = (p: PaymentRow) => {
    const parentPhone = p.students?.father_contact || p.students?.mother_contact || p.students?.whatsapp;
    if (!parentPhone) { toast.error("No parent contact found"); return; }
    openWhatsApp(parentPhone, templates.feeReminder(p.students!.name, p.amount, p.date));
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const summary = getStudentPaymentSummary();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground font-body">{payments.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTnC(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold hover:opacity-90">
            <FileText className="w-4 h-4" /> T&C
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90">
            <Plus className="w-4 h-4" /> Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-accent-foreground" /><p className="text-xs font-semibold text-accent-foreground font-body">Collected</p></div>
          <p className="font-display text-2xl font-bold text-foreground">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-warm rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-warm-foreground" /><p className="text-xs font-semibold text-warm-foreground font-body">Pending</p></div>
          <p className="font-display text-2xl font-bold text-foreground">₹{totalPending.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-2xl shadow-card border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground font-body text-sm">{p.students?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  Inst. {p.installment_no}/{p.total_installments} • {p.method} • {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                </p>
                {p.notes && <p className="text-[10px] text-muted-foreground font-body mt-1">{p.notes}</p>}
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground text-lg">₹{p.amount.toLocaleString()}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[p.status] || ""}`}>{p.status}</span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {(p.status === "pending" || p.status === "partial") && (
                <>
                  <button onClick={() => markAsPaid(p.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-[10px] font-semibold hover:opacity-80">
                    ✓ Mark Paid
                  </button>
                  {p.students && (
                    <button onClick={() => sendReminderToParent(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80">
                      <Send className="w-3 h-3" /> Remind
                    </button>
                  )}
                </>
              )}
              <button onClick={() => setShowInvoice(p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:opacity-80">
                <FileText className="w-3 h-3" /> Invoice
              </button>
              <button onClick={() => deletePayment(p.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-semibold hover:opacity-80 ml-auto">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No payments found.</p>}
      </div>

      {/* Record Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-active animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Record Payment</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* Payment Type */}
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {([
                { key: "full", label: "Full", icon: "💰" },
                { key: "part", label: "Part", icon: "½" },
                { key: "installment", label: "3-Part (50/30/20)", icon: "📅" },
                { key: "renewal", label: "Renewal", icon: "🔄" },
                { key: "upgrade", label: "Upgrade", icon: "⬆️" },
              ] as { key: PaymentType; label: string; icon: string }[]).map(t => (
                <button key={t.key} onClick={() => setPaymentType(t.key)}
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all",
                    paymentType === t.key ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground")}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Student</label>
                <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number}) - ₹{s.fee_amount}</option>)}
                </select>
              </div>

              {/* Student Payment Summary */}
              {selectedStudent && (
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs font-semibold text-foreground font-body mb-1">Fee Summary for {selectedStudent.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-body">
                    <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold text-foreground">₹{summary.total.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold text-accent-foreground">₹{summary.paid.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Pending:</span> <span className="font-semibold text-destructive">₹{(summary.total - summary.paid).toLocaleString()}</span></div>
                  </div>
                </div>
              )}

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
                    {["paid", "pending", "partial"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* 50/30/20 Installment Schedule Preview */}
              {paymentType === "installment" && selectedStudent && (
                <div className="bg-accent/50 rounded-xl p-3 border border-accent">
                  <p className="text-xs font-bold text-foreground font-body mb-2">📅 3-Part Payment Schedule (50/30/20)</p>
                  <p className="text-[10px] text-muted-foreground font-body mb-2">Total Fee: ₹{selectedStudent.fee_amount.toLocaleString()}</p>
                  {getInstallmentSchedule().map(s => (
                    <div key={s.no} className="flex justify-between text-[11px] font-body py-1 border-b border-border/50 last:border-0">
                      <span className="text-foreground font-semibold">#{s.no} — {s.pct}% — {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
                      <span className="font-bold text-primary">₹{s.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={addPayment} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90">Record</button>
            </div>
          </div>
        </div>
      )}

      {/* T&C Preview */}
      {showTnC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowTnC(false)}>
          <div className="bg-card rounded-2xl w-full max-w-2xl h-[80vh] shadow-active animate-fade-in flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display font-bold text-foreground">Terms & Conditions</h2>
              <button onClick={() => setShowTnC(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <iframe src="/artneelam_terms_conditions.pdf" className="flex-1 w-full rounded-b-2xl" />
          </div>
        </div>
      )}

      {/* Professional Invoice Modal */}
      {showInvoice && <InvoiceModal payment={showInvoice} allPayments={payments} onClose={() => setShowInvoice(null)} />}
    </div>
  );
}

function InvoiceModal({ payment, allPayments, onClose }: { payment: PaymentRow; allPayments: PaymentRow[]; onClose: () => void }) {
  const studentPayments = allPayments.filter(p => p.student_id === payment.student_id);
  const totalPaid = studentPayments.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = studentPayments.filter(p => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const totalFee = payment.students?.fee_amount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-active animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 print:p-4" id="invoice-area">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b-2 border-[#1e3a5f] pb-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Art Neelam" className="w-14 h-auto" />
              <div>
                <h2 className="font-display font-bold text-[#1e3a5f] text-lg">Art Neelam Academy</h2>
                <p className="text-[10px] text-[#666] font-body">Drawing & Painting Classes</p>
                <p className="text-[9px] text-[#999] font-body">📞 +91 9920546217</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-[#1e3a5f] text-base">INVOICE</p>
              <p className="text-[10px] text-[#999] font-body">#{payment.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-[10px] text-[#666] font-body mt-1">
                {new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-[#999] font-body font-semibold uppercase tracking-wide">Billed To</p>
              <p className="text-sm font-bold text-[#1e3a5f] font-body">{payment.students?.name}</p>
              <p className="text-[10px] text-[#666] font-body">{payment.students?.roll_number}</p>
              <p className="text-[10px] text-[#666] font-body">{payment.students?.course} Course</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#999] font-body font-semibold uppercase tracking-wide">Payment Info</p>
              <p className="text-xs font-semibold text-[#1e3a5f] font-body">{payment.method}</p>
              <p className="text-[10px] text-[#666] font-body">
                Installment {payment.installment_no}/{payment.total_installments}
              </p>
            </div>
          </div>

          {/* Fee Structure Table */}
          <div className="border border-[#e5d5c0] rounded-xl overflow-hidden mb-4">
            <div className="bg-[#1e3a5f] text-white px-4 py-2 flex justify-between text-xs font-body font-semibold">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="bg-[#fdf8f0]">
              <div className="flex justify-between px-4 py-2.5 text-sm font-body border-b border-[#e5d5c0]">
                <span className="text-[#1e3a5f] font-semibold">{payment.students?.course} Course — Total Fee</span>
                <span className="font-semibold text-[#1e3a5f]">₹{totalFee.toLocaleString()}</span>
              </div>

              {/* Show all installments for this student */}
              {studentPayments.map(sp => (
                <div key={sp.id} className={`flex justify-between px-4 py-2 text-xs font-body border-b border-[#e5d5c0]/50 ${sp.id === payment.id ? "bg-accent/30" : ""}`}>
                  <span className="text-[#666]">
                    {sp.notes || `Installment ${sp.installment_no}`}
                    <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${sp.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {sp.status}
                    </span>
                  </span>
                  <span className="font-semibold text-[#1e3a5f]">₹{sp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#fdf8f0] rounded-xl p-4 mb-4 space-y-1.5">
            <div className="flex justify-between text-xs font-body">
              <span className="text-[#666]">Total Fee</span>
              <span className="font-semibold text-[#1e3a5f]">₹{totalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-body">
              <span className="text-[#666]">Total Paid</span>
              <span className="font-semibold text-green-700">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-body border-t border-[#e5d5c0] pt-1.5">
              <span className="font-semibold text-[#1e3a5f]">Pending Balance</span>
              <span className="font-bold text-[#c9a227]">₹{(totalFee - totalPaid).toLocaleString()}</span>
            </div>
          </div>

          {/* Current Payment */}
          <div className="flex justify-between items-center bg-[#1e3a5f] text-white rounded-xl px-4 py-3">
            <span className="text-sm font-semibold font-body">This Payment</span>
            <span className="font-display font-bold text-xl">₹{payment.amount.toLocaleString()}</span>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[9px] text-[#999] font-body">Thank you for choosing Art Neelam Academy</p>
            <p className="text-[9px] text-[#ccc] font-body mt-1">This is a computer-generated invoice</p>
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
