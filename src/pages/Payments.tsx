import { useState } from "react";
import { DUMMY_PAYMENTS, Payment, DUMMY_STUDENTS } from "@/data/dummy";
import { Plus, Search, TrendingUp, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { openWhatsApp, templates } from "@/lib/whatsapp";

const statusColors = {
  paid: "bg-accent text-accent-foreground",
  pending: "bg-warm text-warm-foreground",
  partial: "bg-secondary text-secondary-foreground",
};

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>(DUMMY_PAYMENTS);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: DUMMY_STUDENTS[0].id, amount: "", method: "UPI" as const,
    installmentNo: 1, totalInstallments: 1, notes: "", status: "paid" as const, date: new Date().toISOString().slice(0, 10),
  });

  const filtered = payments.filter(p =>
    p.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = payments.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  const addPayment = () => {
    if (!form.amount) return;
    const student = DUMMY_STUDENTS.find(s => s.id === form.studentId);
    if (!student) return;
    const id = `P${String(payments.length + 1).padStart(3, "0")}`;
    setPayments(prev => [...prev, {
      ...form, id, studentName: student.name,
      amount: Number(form.amount), installmentNo: Number(form.installmentNo),
      totalInstallments: Number(form.totalInstallments),
    }]);
    setShowForm(false);
  };

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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent-foreground" />
            <p className="text-xs font-semibold text-accent-foreground font-body">Collected</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-warm rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-warm-foreground" />
            <p className="text-xs font-semibold text-warm-foreground font-body">Pending</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">₹{totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Payments List */}
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-2xl shadow-card border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground font-body text-sm">{p.studentName}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  Installment {p.installmentNo}/{p.totalInstallments} • {p.method} • {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                </p>
                {p.notes && <p className="text-[10px] text-muted-foreground font-body mt-1">{p.notes}</p>}
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground text-lg">₹{p.amount.toLocaleString()}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[p.status]}`}>{p.status}</span>
              </div>
            </div>
            {p.status === "pending" && (
              <button onClick={() => {
                const student = DUMMY_STUDENTS.find(s => s.id === p.studentId);
                if (student) openWhatsApp(student.whatsapp, templates.feeReminder(p.studentName, p.amount));
              }}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80 transition-opacity">
                <Send className="w-3 h-3" /> Send Fee Reminder via WhatsApp
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Payment Modal */}
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
                <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {DUMMY_STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
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
                  <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["UPI", "Cash", "Bank Transfer", "Cheque"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["paid", "pending", "partial"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Installment #</label>
                  <input type="number" value={form.installmentNo} onChange={e => setForm(p => ({ ...p, installmentNo: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Total Installments</label>
                  <input type="number" value={form.totalInstallments} onChange={e => setForm(p => ({ ...p, totalInstallments: Number(e.target.value) }))}
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
