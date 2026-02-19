import { useState } from "react";
import { DUMMY_STUDENTS, Student, BATCHES } from "@/data/dummy";
import { Search, Plus, IdCard, Phone, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const courseColors: Record<string, string> = {
  Basic: "bg-accent text-accent-foreground",
  Advanced: "bg-secondary text-secondary-foreground",
  Professional: "bg-primary-soft text-primary",
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>(DUMMY_STUDENTS);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "", dob: "", schoolName: "", address: "", emergencyContact: "",
    fatherName: "", fatherContact: "", motherName: "", motherContact: "",
    guardianName: "", whatsapp: "", email: "", course: "Basic" as const,
    batch: "Morning A", enrollmentDate: "", validityStart: "", validityEnd: "",
    totalSessions: 48, feeAmount: 12000, paymentPlan: "Monthly",
  });

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === "All" || s.batch === batchFilter;
    return matchSearch && matchBatch;
  });

  const handleSubmit = () => {
    if (!form.name || !form.whatsapp) return;
    const newRoll = `NAS-${String(students.length + 1).padStart(4, "0")}`;
    const id = `S${String(students.length + 1).padStart(3, "0")}`;
    setStudents(prev => [...prev, {
      ...form, id, rollNumber: newRoll, status: "active",
      totalSessions: Number(form.totalSessions), feeAmount: Number(form.feeAmount),
    }]);
    setShowForm(false);
  };

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
            {b}
          </button>
        ))}
      </div>

      {/* Student Cards */}
      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="bg-card rounded-2xl shadow-card border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-lg flex-shrink-0">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground font-body text-sm">{s.name}</p>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{s.rollNumber}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${courseColors[s.course]}`}>{s.course}</span>
                  <span className="text-[10px] text-muted-foreground font-body">{s.batch}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === "active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                  Valid: {new Date(s.validityEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} • ₹{s.feeAmount.toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <a href={`tel:${s.whatsapp}`} className="p-2 rounded-lg bg-accent hover:opacity-80 transition-opacity">
                  <Phone className="w-3.5 h-3.5 text-accent-foreground" />
                </a>
                <Link to={`/id-card?id=${s.id}`} className="p-2 rounded-lg bg-secondary hover:opacity-80 transition-opacity">
                  <IdCard className="w-3.5 h-3.5 text-secondary-foreground" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-active animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Register Student</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Section title="Personal Info">
                <FormField label="Student Name*" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                <FormField label="Date of Birth" type="date" value={form.dob} onChange={v => setForm(p => ({ ...p, dob: v }))} />
                <FormField label="School Name" value={form.schoolName} onChange={v => setForm(p => ({ ...p, schoolName: v }))} />
                <FormField label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} textarea />
                <FormField label="Emergency Contact" type="tel" value={form.emergencyContact} onChange={v => setForm(p => ({ ...p, emergencyContact: v }))} />
              </Section>
              <Section title="Parent / Guardian">
                <FormField label="Father Name" value={form.fatherName} onChange={v => setForm(p => ({ ...p, fatherName: v }))} />
                <FormField label="Father Contact" type="tel" value={form.fatherContact} onChange={v => setForm(p => ({ ...p, fatherContact: v }))} />
                <FormField label="Mother Name" value={form.motherName} onChange={v => setForm(p => ({ ...p, motherName: v }))} />
                <FormField label="Mother Contact" type="tel" value={form.motherContact} onChange={v => setForm(p => ({ ...p, motherContact: v }))} />
                <FormField label="Guardian Name (optional)" value={form.guardianName} onChange={v => setForm(p => ({ ...p, guardianName: v }))} />
                <FormField label="WhatsApp Number*" type="tel" value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} />
                <FormField label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
              </Section>
              <Section title="Course Details">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Course</label>
                  <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Basic", "Advanced", "Professional"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Batch</label>
                  <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {BATCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <FormField label="Enrollment Date" type="date" value={form.enrollmentDate} onChange={v => setForm(p => ({ ...p, enrollmentDate: v }))} />
                <FormField label="Validity Start" type="date" value={form.validityStart} onChange={v => setForm(p => ({ ...p, validityStart: v }))} />
                <FormField label="Validity End" type="date" value={form.validityEnd} onChange={v => setForm(p => ({ ...p, validityEnd: v }))} />
                <FormField label="Total Sessions" type="number" value={String(form.totalSessions)} onChange={v => setForm(p => ({ ...p, totalSessions: Number(v) }))} />
                <FormField label="Fee Amount (₹)" type="number" value={String(form.feeAmount)} onChange={v => setForm(p => ({ ...p, feeAmount: Number(v) }))} />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Payment Plan</label>
                  <select value={form.paymentPlan} onChange={e => setForm(p => ({ ...p, paymentPlan: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Monthly", "Quarterly", "Lump Sum", "Custom"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </Section>
              <div className="p-3 bg-accent rounded-xl">
                <p className="text-xs text-accent-foreground font-body">✓ By submitting, student/guardian agrees to the studio's terms & conditions.</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-card px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
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
