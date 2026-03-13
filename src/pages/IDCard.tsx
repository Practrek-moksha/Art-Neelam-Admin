import { useState, useEffect, useRef } from "react";
import { Printer, Search } from "lucide-react";
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
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("students")
        .select("id, name, roll_number, course, batch, whatsapp, photo_url, validity_end, father_contact, mother_contact")
        .in("status", ["active", "new"]).order("name");
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

      {/* Paint Palette Shaped ID Card */}
      {student && (
        <div className="flex justify-center">
          <div ref={cardRef} className="relative print:shadow-none" style={{ width: "340px" }}>
            {/* Palette shape using CSS */}
            <svg viewBox="0 0 340 220" className="absolute inset-0 w-full h-full" style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.15))" }}>
              <defs>
                <linearGradient id="paletteBg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#2c5282" />
                </linearGradient>
              </defs>
              <path d="M50,10 Q10,10 10,50 L10,170 Q10,210 50,210 L280,210 Q320,210 325,180 Q335,140 310,120 Q290,105 295,80 Q300,55 325,50 Q335,30 310,15 Q300,10 280,10 Z"
                fill="url(#paletteBg)" />
              {/* Paint dots */}
              <circle cx="305" cy="55" r="12" fill="#f48fb1" opacity="0.9" />
              <circle cx="315" cy="95" r="10" fill="#81c784" opacity="0.9" />
              <circle cx="305" cy="135" r="11" fill="#ffb74d" opacity="0.9" />
              <circle cx="310" cy="170" r="9" fill="#64b5f6" opacity="0.9" />
              {/* Thumb hole */}
              <ellipse cx="60" cy="175" rx="22" ry="18" fill="#fdf8f0" />
            </svg>

            <div className="relative z-10 p-5 pr-16" style={{ minHeight: "220px" }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 ml-3">
                <img src={logoImg} alt="Art Neelam" className="w-10 h-auto rounded-lg" />
                <div>
                  <h2 className="font-display font-bold text-white text-xs leading-tight">Art Neelam Academy</h2>
                  <p className="text-[9px] text-white/70 font-body">Student Identity Card</p>
                </div>
              </div>

              {/* Body */}
              <div className="flex gap-3 ml-3">
                <div className="flex-shrink-0">
                  <div className="w-16 h-20 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-white text-2xl">{student.name[0]}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-white text-sm leading-tight truncate">{student.name}</h3>
                  <div className="mt-1.5 space-y-1">
                    <InfoRow label="ID" value={student.roll_number} highlight />
                    <InfoRow label="Course" value={student.course} />
                    <InfoRow label="Batch" value={student.batch.split(" (")[0]} />
                    <InfoRow label="Phone" value={student.whatsapp} />
                    <InfoRow label="Parent" value={student.father_contact || student.mother_contact || "—"} />
                    <InfoRow label="Valid" value={student.validity_end ? new Date(student.validity_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 ml-3 mr-8">
                <div className="flex items-center justify-between px-2 py-1 rounded-lg" style={{ background: "linear-gradient(90deg, #c9a227, #d4af37)" }}>
                  <span className="text-[8px] text-white font-body font-semibold">artneelam.academy</span>
                  <span className="text-[8px] text-white font-body font-semibold">{student.roll_number}</span>
                </div>
              </div>
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
      <span className="text-[8px] text-white/50 font-body w-10 flex-shrink-0">{label}</span>
      <span className={`text-[9px] font-semibold font-body ${highlight ? "text-[#d4af37]" : "text-white"}`}>{value}</span>
    </div>
  );
}
