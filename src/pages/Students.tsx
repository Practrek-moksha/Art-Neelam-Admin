import { useState, useEffect } from "react";
import { BATCHES } from "@/data/dummy";
import { Search, Plus, ChevronRight, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const courseColors: Record<string, string> = {
  Basic: "bg-accent text-accent-foreground",
  Advanced: "bg-secondary text-secondary-foreground",
  Professional: "bg-primary-soft text-primary",
};

type Student = {
  id: string;
  roll_number: string;
  name: string;
  course: string;
  batch: string;
  status: string;
  validity_end: string | null;
  fee_amount: number;
  whatsapp: string;
  dob: string | null;
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();

  const defaultForm = {
    name: "", dob: "", school_name: "", address: "", emergency_contact: "",
    father_name: "", father_contact: "", mother_name: "", mother_contact: "",
    guardian_name: "", whatsapp: "", email: "", course: "Basic",
    batch: BATCHES[0], enrollment_date: new Date().toISOString().slice(0, 10),
    validity_start: new Date().toISOString().slice(0, 10), validity_end: "",
    total_sessions: 48, fee_amount: 12000, payment_plan: "Monthly",
    discount_amount: 0, discount_percent: 0,
  };

  const [form, setForm] = useState(defaultForm);

  // Handle prefill from lead conversion
  useEffect(() => {
    const state = location.state as any;
    if (state?.prefill) {
      setForm(prev => ({
        ...prev,
        name: state.prefill.name || "",
        whatsapp: state.prefill.whatsapp || "",
        email: state.prefill.email || "",
        course: state.prefill.course || "Basic",
      }));
      setShowForm(true);
      // Clear state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-calculate validity end when start or sessions change
  useEffect(() => {
    if (form.validity_start && form.total_sessions) {
      const start = new Date(form.validity_start);
      // Assume ~4 sessions/week, so weeks = sessions/4, add buffer
      const weeks = Math.ceil(form.total_sessions / 4);
      const end = new Date(start);
      end.setDate(end.getDate() + weeks * 7);
      setForm(prev => ({ ...prev, validity_end: end.toISOString().slice(0, 10) }));
    }
  }, [form.validity_start, form.total_sessions]);

  const fetchStudents = async () => {
    const { data, error } = await supabase.from("students").select("id, roll_number, name, course, batch, status, validity_end, fee_amount, whatsapp, dob").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load students"); console.error(error); }
    else setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === "All" || s.batch === batchFilter;
    return matchSearch && matchBatch;
  });

  // Calculate final fee
  const discountVal = form.discount_percent > 0
    ? Math.round(form.fee_amount * form.discount_percent / 100)
    : form.discount_amount;
  const finalFee = Math.max(0, form.fee_amount - discountVal);

  const handleSubmit = async () => {
    if (!form.name || !form.whatsapp) {
      toast.error("Name and WhatsApp are required");
      return;
    }
    const { error } = await supabase.from("students").insert({
      name: form.name, whatsapp: form.whatsapp, dob: form.dob || null,
      school_name: form.school_name || null, address: form.address || null,
      emergency_contact: form.emergency_contact || null,
      father_name: form.father_name || null, father_contact: form.father_contact || null,
      mother_name: form.mother_name || null, mother_contact: form.mother_contact || null,
      guardian_name: form.guardian_name || null, email: form.email || null,
      course: form.course, batch: form.batch,
      enrollment_date: form.enrollment_date || null,
      validity_start: form.validity_start || null, validity_end: form.validity_end || null,
      total_sessions: Number(form.total_sessions), fee_amount: finalFee,
      payment_plan: form.payment_plan,
      discount_amount: discountVal, discount_percent: form.discount_percent,
      roll_number: "TEMP", // trigger will auto-generate
    });
    if (error) { toast.error("Failed to add student: " + error.message); console.error(error); }
    else {
      toast.success("Student registered!");
      setShowForm(false);
      setForm(defaultForm);
      fetchStudents();
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground font-body">{filtered.length} enrolled</p>
        </div>
        <div className="flex gap-2">
          <Link to="/register" className="flex items-center gap-1.5 px-3 py-2 border border-primary text-primary rounded-xl text-xs font-semibold hover:bg-primary-soft transition-colors">
            🔗 Share Form
          </Link>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll..."
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Batch Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {["All", ...BATCHES].map(b => (
          <button key={b} onClick={() => setBatchFilter(b)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold font-body transition-all",
              batchFilter === b ? "gradient-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary")}>
            {b.split(" (")[0]}
          </button>
        ))}
      </div>

      {/* Student Cards */}
      <div className="space-y-2">
        {filtered.map(s => (
          <Link key={s.id} to={`/students/${s.id}`} className="block bg-card rounded-2xl shadow-card border border-border p-4 hover:border-primary/30 hover:shadow-active transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-lg flex-shrink-0">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground font-body text-sm">{s.name}</p>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{s.roll_number}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${courseColors[s.course] || ""}`}>{s.course}</span>
                  <span className="text-[10px] text-muted-foreground font-body">{s.batch.split(" (")[0]}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === "active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                  {s.validity_end ? `Valid: ${new Date(s.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}` : ""} • ₹{s.fee_amount.toLocaleString()}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No students found. Add your first student!</p>}
      </div>

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => { setShowForm(false); setForm(defaultForm); }}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-active animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card px-6 py-4 border-b border-border flex items-center justify-between z-10">
              <h2 className="font-display text-xl font-bold text-foreground">Register Student</h2>
              <button onClick={() => { setShowForm(false); setForm(defaultForm); }} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Section title="Personal Info">
                <FormField label="Student Name*" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                <FormField label="Date of Birth" type="date" value={form.dob} onChange={v => setForm(p => ({ ...p, dob: v }))} />
                <FormField label="School Name" value={form.school_name} onChange={v => setForm(p => ({ ...p, school_name: v }))} />
                <FormField label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} textarea />
                <FormField label="Emergency Contact" type="tel" value={form.emergency_contact} onChange={v => setForm(p => ({ ...p, emergency_contact: v }))} />
              </Section>
              <Section title="Parent / Guardian">
                <FormField label="Father Name" value={form.father_name} onChange={v => setForm(p => ({ ...p, father_name: v }))} />
                <FormField label="Father Contact" type="tel" value={form.father_contact} onChange={v => setForm(p => ({ ...p, father_contact: v }))} />
                <FormField label="Mother Name" value={form.mother_name} onChange={v => setForm(p => ({ ...p, mother_name: v }))} />
                <FormField label="Mother Contact" type="tel" value={form.mother_contact} onChange={v => setForm(p => ({ ...p, mother_contact: v }))} />
                <FormField label="Guardian Name (optional)" value={form.guardian_name} onChange={v => setForm(p => ({ ...p, guardian_name: v }))} />
                <FormField label="WhatsApp Number*" type="tel" value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} />
                <FormField label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
              </Section>
              <Section title="Course & Batch">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Course</label>
                  <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Basic", "Advanced", "Professional"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Batch</label>
                  <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <FormField label="Enrollment Date" type="date" value={form.enrollment_date} onChange={v => setForm(p => ({ ...p, enrollment_date: v }))} />
                <FormField label="Validity Start" type="date" value={form.validity_start} onChange={v => setForm(p => ({ ...p, validity_start: v }))} />
                <FormField label="Validity End (auto-calculated)" type="date" value={form.validity_end} onChange={v => setForm(p => ({ ...p, validity_end: v }))} />
                <FormField label="Total Sessions" type="number" value={String(form.total_sessions)} onChange={v => setForm(p => ({ ...p, total_sessions: Number(v) }))} />
              </Section>
              <Section title="Fees & Discount">
                <FormField label="Fee Amount (₹)" type="number" value={String(form.fee_amount)} onChange={v => setForm(p => ({ ...p, fee_amount: Number(v) }))} />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Payment Plan</label>
                  <select value={form.payment_plan} onChange={e => setForm(p => ({ ...p, payment_plan: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Monthly", "Quarterly", "Yearly", "Lump Sum", "Custom"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Discount %" type="number" value={String(form.discount_percent)} onChange={v => setForm(p => ({ ...p, discount_percent: Number(v), discount_amount: 0 }))} />
                  <FormField label="Discount ₹" type="number" value={String(form.discount_amount)} onChange={v => setForm(p => ({ ...p, discount_amount: Number(v), discount_percent: 0 }))} />
                </div>
                {/* Fee Summary */}
                <div className="bg-accent rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="font-semibold text-foreground">₹{form.fee_amount.toLocaleString()}</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-xs font-body">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold text-accent-foreground">-₹{discountVal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-body font-bold border-t border-border pt-1">
                    <span className="text-foreground">Final Fee</span>
                    <span className="text-primary">₹{finalFee.toLocaleString()}</span>
                  </div>
                </div>
              </Section>
              <div className="p-3 bg-accent rounded-xl">
                <p className="text-xs text-accent-foreground font-body">✓ By submitting, student/guardian agrees to Art Neelam Academy's terms & conditions.</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-card px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => { setShowForm(false); setForm(defaultForm); }} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-opacity">Register Student</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display font-bold text-foreground text-sm mb-3 pb-1.5 border-b border-border">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground font-body">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
          className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      )}
    </div>
  );
}
