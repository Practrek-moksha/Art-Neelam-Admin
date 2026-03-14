import { useState, useEffect } from "react";
import { Printer, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

type StudentCard = {
  id: string; name: string; roll_number: string; course: string;
  batch: string; whatsapp: string; photo_url: string | null;
  validity_end: string | null; father_contact: string | null; mother_contact: string | null;
};

export default function IDCard() {
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [printAll, setPrintAll] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("students")
        .select("id, name, roll_number, course, batch, whatsapp, photo_url, validity_end, father_contact, mother_contact")
        .in("status", ["active", "new"]).order("name");
      if (error) toast.error("Failed to load students");
      const list = data || [];
      setStudents(list);

      const params = new URLSearchParams(window.location.search);
      const preId = params.get("id");
      if (preId && list.find(s => s.id === preId)) setSelectedId(preId);
      else if (list.length > 0) setSelectedId(list[0].id);
      setLoading(false);
    })();
  }, []);

  const student = students.find(s => s.id === selectedId);
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">ID Card Generator</h1>
          <p className="text-sm text-muted-foreground font-body">Generate & print student ID cards</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPrintAll(true); setTimeout(() => window.print(), 300); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold hover:opacity-90">
            <Download className="w-4 h-4" /> Print All
          </button>
          <button onClick={() => { setPrintAll(false); window.print(); }}
            className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 print:hidden">
        {filtered.map(s => (
          <button key={s.id} onClick={() => setSelectedId(s.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold font-body transition-all border ${
              selectedId === s.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}>
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-display font-bold text-foreground text-xs">{s.name[0]}</span>
            {s.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Single ID Card Preview — White Background */}
      {student && !printAll && (
        <div className="flex justify-center">
          <div id="id-card-print-area" className="print:shadow-none" style={{ width: "360px" }}>
            <SingleIDCard student={student} />
          </div>
        </div>
      )}

      {/* Print All */}
      <div id="id-card-print-all" className={printAll ? "" : "hidden"}>
        <div className="id-card-grid">
          {students.map(s => (
            <div key={s.id} className="id-card-cell">
              <SingleIDCard student={s} />
            </div>
          ))}
        </div>
      </div>

      {students.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No students found. Add students first.</p>}

      {students.length > 0 && (
        <div className="print:hidden">
          <h3 className="font-display font-bold text-foreground text-base mb-3">All Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(s => (
              <div key={s.id} onClick={() => setSelectedId(s.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedId === s.id ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/50"
                }`}>
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary">
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{s.roll_number} • {s.course}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SingleIDCard({ student }: { student: StudentCard }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-active print:shadow-none print:rounded-lg border border-border"
      style={{ background: "#ffffff" }}>
      
      {/* Top Banner with Logo */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-border">
        <img src={logoImg} alt="Art Neelam" className="w-20 h-20 rounded-xl object-contain" />
        <div>
          <h2 className="font-display font-bold text-lg leading-tight" style={{ color: "#1e3a5f" }}>Art Neelam Academy</h2>
          <p className="text-[10px] font-body font-medium tracking-wide text-muted-foreground">STUDENT IDENTITY CARD</p>
        </div>
      </div>

      {/* Accent Line */}
      <div className="h-1 mx-5" style={{ background: "linear-gradient(90deg, #d4af37, #c9a227, transparent)" }} />

      {/* Body */}
      <div className="px-5 py-4 flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div className="w-20 h-24 rounded-xl overflow-hidden flex items-center justify-center bg-muted"
            style={{ border: "2px solid rgba(212,175,55,0.5)" }}>
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-3xl" style={{ color: "#d4af37" }}>{student.name[0]}</span>
            )}
          </div>
        </div>

        {/* Details — black text on white bg */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="font-display font-bold text-base leading-tight truncate text-foreground">{student.name}</h3>
          
          <div className="space-y-1">
            <IDField label="ID" value={student.roll_number} highlight />
            <IDField label="Course" value={student.course} />
            <IDField label="Batch" value={student.batch} />
            <IDField label="Phone" value={student.whatsapp} />
            <IDField label="Parent" value={student.father_contact || student.mother_contact || "—"} />
            <IDField label="Valid Till" value={student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "linear-gradient(90deg, #d4af37, #c9a227)" }}>
          <span className="text-[9px] font-body font-bold text-white">artneelam.academy</span>
          <span className="text-[9px] font-body font-bold text-white">📞 +91 99677 01108</span>
        </div>
      </div>
    </div>
  );
}

function IDField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-body w-12 flex-shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-semibold font-body ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
