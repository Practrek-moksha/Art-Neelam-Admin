import { useState, useEffect } from "react";
import { Plus, Search, TrendingUp, X, Send } from "lucide-react";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  paid: "bg-accent text-accent-foreground",
  pending: "bg-warm text-warm-foreground",
  partial: "bg-secondary text-secondary-foreground",
};

type PaymentRow = {
  id: string; student_id: string; amount: number; method: string | null;
  date: string; installment_no: number | null; total_installments: number | null;
  notes: string | null; status: string;
  students: { name: string; whatsapp: string; father_contact: string | null; mother_contact: string | null } | null;
};

type StudentOption = { id: string; name: string; roll_number: string; whatsapp: string; father_contact: string | null; mother_contact: string | null };

export default function Payments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    student_id: "", amount: "", method: "UPI", installment_no: 1, total_installments: 1, notes: "", status: "paid", date: new Date().toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    const [pRes, sRes] = await Promise.all([
      supabase.from("payments").select("*, students(name, whatsapp, father_contact, mother_contact)").order("date", { ascending: false }),
      supabase.from("students").select("id, name, roll_number, whatsapp, father_contact, mother_contact"),
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
  const totalPending = payments.filter(p => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  const addPayment = async () => {
    if (!form.amount || !form.student_id) {
      toast.error("Student and amount are required");
      return;
    }
    const { error } = await supabase.from("payments").insert({
      student_id: form.student_id, amount: Number(form.amount), method: form.method,
      date: form.date, installment_no: form.installment_no, total_installments: form.total_installments,
      notes: form.notes || null, status: form.status,
    });
    if (error) { toast.error("Failed to record payment: " + error.message); return; }
    toast.success("Payment recorded!");
    setShowForm(false);
    setForm(f => ({ ...f, amount: "", notes: "", installment_no: f.installment_no + 1 }));
    fetchData();
  };

  const sendReminderToParent = (p: PaymentRow) => {
    const parentPhone = p.students?.father_contact || p.students?.mother_contact || p.students?.whatsapp;
    if (!parentPhone) { toast.error("No parent contact found"); return; }
    openWhatsApp(parentPhone, templates.feeReminder(p.students!.name, p.amount, p.date));
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground font-body">{payments.length} transactions</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Record
        </button>
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
                  Installment {p.installment_no}/{p.total_installments} • {p.method} • {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                </p>
                {p.notes && <p className="text-[10px] text-muted-foreground font-body mt-1">{p.notes}</p>}
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground text-lg">₹{p.amount.toLocaleString()}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[p.status] || ""}`}>{p.status}</span>
              </div>
            </div>
            {p.status === "pending" && p.students && (
              <button onClick={() => sendReminderToParent(p)}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80 transition-opacity">
                <Send className="w-3 h-3" /> Send Fee Reminder to Parent
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No payments found.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-active animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Record Payment</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Student</label>
                <select value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                </select>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Installment #</label>
                  <input type="number" value={form.installment_no} onChange={e => setForm(p => ({ ...p, installment_no: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Total Installments</label>
                  <input type="number" value={form.total_installments} onChange={e => setForm(p => ({ ...p, total_installments: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
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
    </div>
  );
}
