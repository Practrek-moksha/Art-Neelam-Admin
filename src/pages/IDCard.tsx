import { useState, useEffect, useRef } from "react";
import { Printer, Search, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("students")
        .select("id, name, roll_number, course, batch, whatsapp, photo_url, validity_end, father_contact, mother_contact")
        .eq("status", "active").order("name");
      if (error) toast.error("Failed to load students");
      const list = data || [];
      setStudents(list);
      if (list.length > 0) setSelectedId(list[0].id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">ID Card Generator</h1>
          <p className="text-sm text-muted-foreground font-body">Generate & print student ID cards</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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

      {student && (
        <div className="flex justify-center">
          <div ref={cardRef} className="w-80 rounded-3xl overflow-hidden shadow-active border border-border print:shadow-none" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)" }}>
            {/* Card Header - Deep Blue */}
            <div className="p-5 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-sm leading-tight">Art Neelam Academy</h2>
                  <p className="text-[10px] text-white/70 font-body">Student Identity Card</p>
                </div>
              </div>
            </div>

            {/* Card Body - Cream */}
            <div className="bg-[#fdf8f0] p-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-24 rounded-2xl bg-[#1e3a5f]/10 border-2 border-[#1e3a5f]/20 flex items-center justify-center overflow-hidden">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-[#1e3a5f] text-3xl">{student.name[0]}</span>
                    )}
                  </div>
                  <div className="w-20 h-20 mt-2 rounded-xl bg-white border border-[#1e3a5f]/10 flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-0.5">
                      {Array(25).fill(0).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${Math.random() > 0.5 ? "bg-[#1e3a5f]" : "bg-white"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-[#1e3a5f] text-base leading-tight">{student.name}</h3>
                  <div className="mt-2 space-y-1.5">
                    <InfoRow label="ID" value={student.roll_number} highlight />
                    <InfoRow label="Course" value={student.course} />
                    <InfoRow label="Batch" value={student.batch.split(" (")[0]} />
                    <InfoRow label="Phone" value={student.whatsapp} />
                    <InfoRow label="Parent" value={student.father_contact || student.mother_contact || "—"} />
                    <InfoRow label="Valid Till" value={student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e3a5f]/10">
                <p className="text-[9px] text-[#1e3a5f]/50 font-body text-center">
                  If found, please return to Art Neelam Academy
                </p>
                <p className="text-[10px] font-semibold text-[#1e3a5f] text-center font-body mt-0.5">
                  📞 +91 9920546217
                </p>
              </div>
            </div>

            {/* Card Footer - Gold accent */}
            <div className="px-5 py-2 flex items-center justify-between" style={{ background: "linear-gradient(90deg, #c9a227 0%, #d4af37 100%)" }}>
              <span className="text-[9px] text-white font-body font-semibold">artneelam.academy</span>
              <span className="text-[9px] text-white font-body font-semibold">{student.roll_number}</span>
            </div>
          </div>
        </div>
      )}

      {students.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No students found. Add students first.</p>}

      {/* All Students Grid */}
      {students.length > 0 && (
        <div>
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

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-[#1e3a5f]/50 font-body w-12 flex-shrink-0">{label}</span>
      <span className={`text-[10px] font-semibold font-body ${highlight ? "text-[#c9a227]" : "text-[#1e3a5f]"}`}>{value}</span>
    </div>
  );
}
