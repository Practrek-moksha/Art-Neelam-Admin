import { useState, useEffect } from "react";
import { EXPENSE_CATEGORIES } from "@/data/dummy";
import { Plus, Receipt, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ExpenseRow = { id: string; category: string; description: string | null; amount: number; date: string; method: string | null };

const catColors: Record<string, string> = {
  "Art Supplies": "bg-primary-soft text-primary",
  "Utilities": "bg-secondary text-secondary-foreground",
  "Rent": "bg-warm text-warm-foreground",
  "Marketing": "bg-accent text-accent-foreground",
  "Maintenance": "bg-muted text-muted-foreground",
  "Salaries": "bg-secondary text-secondary-foreground",
  "Equipment": "bg-warm text-warm-foreground",
  "Other": "bg-muted text-muted-foreground",
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [form, setForm] = useState({ category: "Art Supplies", description: "", amount: "", method: "UPI", date: new Date().toISOString().slice(0, 10) });

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
    if (error) toast.error("Failed to load expenses");
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const filtered = activeCategory === "All" ? expenses : expenses.filter(e => e.category === activeCategory);
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTotal = expenses.filter(e => e.date.startsWith(monthKey)).reduce((a, e) => a + e.amount, 0);

  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0),
  })).filter(c => c.total > 0);

  const addExpense = async () => {
    if (!form.description || !form.amount) return;
    const { error } = await supabase.from("expenses").insert({
      category: form.category, description: form.description, amount: Number(form.amount), method: form.method, date: form.date,
    });
    if (error) { toast.error("Failed to add expense: " + error.message); return; }
    toast.success("Expense added!");
    setShowForm(false);
    setForm({ category: "Art Supplies", description: "", amount: "", method: "UPI", date: new Date().toISOString().slice(0, 10) });
    fetchExpenses();
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground font-body">{expenses.length} records</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl shadow-card border border-border p-4">
          <p className="text-xs text-muted-foreground font-body">This Month</p>
          <p className="font-display text-2xl font-bold text-foreground mt-1">₹{monthTotal.toLocaleString()}</p>
        </div>
        <div className="bg-primary-soft rounded-2xl p-4">
          <p className="text-xs text-primary font-body font-semibold">Total Spent</p>
          <p className="font-display text-2xl font-bold text-foreground mt-1">₹{total.toLocaleString()}</p>
        </div>
      </div>

      {categoryTotals.length > 0 && (
        <div className="bg-card rounded-2xl shadow-card border border-border p-4">
          <h3 className="font-display font-bold text-foreground text-sm mb-3">By Category</h3>
          <div className="space-y-2">
            {categoryTotals.map(({ cat, total: ct }) => (
              <div key={cat} className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-body ${catColors[cat] || "bg-muted text-muted-foreground"}`}>{cat}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(ct / total) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground font-body">₹{ct.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", ...EXPENSE_CATEGORIES].map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold font-body transition-all ${activeCategory === c ? "gradient-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="bg-card rounded-2xl shadow-card border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground font-body">{e.description}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">{e.method} • {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-body mt-1 inline-block ${catColors[e.category] || "bg-muted text-muted-foreground"}`}>{e.category}</span>
                </div>
              </div>
              <p className="font-display font-bold text-foreground text-lg">₹{e.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No expenses found.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-active animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Add Expense</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Description*</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Method</label>
                <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {["UPI", "Cash", "Bank Transfer", "Cheque"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground">Cancel</button>
              <button onClick={addExpense} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
