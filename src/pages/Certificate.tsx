import { useState, useEffect, useRef } from "react";
import { Search, Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StudentCert = {
  id: string; name: string; roll_number: string; course: string;
  total_sessions: number; sessionsAttended: number;
};

export default function Certificate() {
  const [students, setStudents] = useState<StudentCert[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [sRes, aRes] = await Promise.all([
        supabase.from("students").select("id, name, roll_number, course, total_sessions").eq("status", "active"),
        supabase.from("attendance").select("student_id, status"),
      ]);
      if (sRes.error) toast.error("Failed to load students");
      const studs = sRes.data || [];
      const att = aRes.data || [];

      const counts: Record<string, number> = {};
      att.forEach(a => {
        if (a.status === "present" || a.status === "late") {
          counts[a.student_id] = (counts[a.student_id] || 0) + 1;
        }
      });

      const enriched = studs.map(s => ({
        ...s,
        sessionsAttended: counts[s.id] || 0,
      }));

      setStudents(enriched);
      const eligible = enriched.filter(s => s.sessionsAttended >= s.total_sessions);
      if (eligible.length > 0) setSelectedId(eligible[0].id);
      else if (enriched.length > 0) setSelectedId(enriched[0].id);
      setLoading(false);
    })();
  }, []);

  const student = students.find(s => s.id === selectedId);
  const isEligible = student ? student.sessionsAttended >= student.total_sessions : false;

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  const eligibleStudents = students.filter(s => s.sessionsAttended >= s.total_sessions);

  const handlePrint = () => {
    if (!isEligible) {
      toast.error("Student has not completed all sessions yet");
      return;
    }
    window.print();
  };

  const certId = student ? `ANA-CERT-${student.roll_number.replace("ANA-", "")}` : "";
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Certificates</h1>
          <p className="text-sm text-muted-foreground font-body">{eligibleStudents.length} students eligible</p>
        </div>
        <button onClick={handlePrint} disabled={!isEligible}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90 disabled:opacity-40">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Student selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filtered.map(s => {
          const eligible = s.sessionsAttended >= s.total_sessions;
          return (
            <button key={s.id} onClick={() => setSelectedId(s.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold font-body transition-all border ${
                selectedId === s.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}>
              {eligible && <Award className="w-3 h-3 text-amber-500" />}
              {s.name.split(" ")[0]}
              <span className="text-[9px] opacity-60">{s.sessionsAttended}/{s.total_sessions}</span>
            </button>
          );
        })}
      </div>

      {/* Certificate Preview */}
      {student && (
        <div className="flex justify-center">
          <div ref={certRef} className="w-full max-w-2xl aspect-[1.4/1] rounded-lg overflow-hidden shadow-active print:shadow-none relative"
            style={{
              background: "linear-gradient(135deg, #fdf8f0 0%, #fff9e6 50%, #fdf8f0 100%)",
              border: "3px solid #c9a227",
            }}>
            {/* Inner border */}
            <div className="absolute inset-3 border-2 border-[#c9a227]/30 rounded-sm" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center px-8 py-6 text-center">
              {/* Gold seal */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "radial-gradient(circle, #d4af37 0%, #c9a227 70%, #b8941f 100%)" }}>
                <Award className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <p className="text-[10px] tracking-[0.3em] text-[#c9a227] font-body font-bold uppercase mb-1">Art Neelam Academy</p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1e3a5f] mb-2">CERTIFICATE OF COMPLETION</h2>

              <p className="text-xs text-[#666] font-body italic mb-4 max-w-md">
                "Creativity takes courage, and every masterpiece begins with a single stroke."
              </p>

              <p className="text-sm text-[#333] font-body mb-1">This is to certify that</p>
              <h3 className="font-display text-xl md:text-2xl font-bold text-[#1e3a5f] border-b-2 border-[#c9a227] pb-1 px-8 mb-2">
                {student.name}
              </h3>

              <p className="text-sm text-[#333] font-body mb-1">has successfully completed the</p>
              <p className="font-display text-lg font-bold text-[#c9a227] mb-3">{student.course} Course</p>

              <p className="text-xs text-[#666] font-body max-w-sm mb-6">
                at Art Neelam Academy. We applaud her commitment to learning and artistic growth
                and wish her continued success in all future creative endeavors.
              </p>

              {/* Signature */}
              <div className="flex items-end justify-between w-full max-w-md">
                <div className="text-center">
                  <p className="text-xs text-[#999] font-body mb-0.5">{today}</p>
                  <div className="w-24 border-t border-[#ccc]" />
                  <p className="text-[10px] text-[#999] font-body mt-0.5">Date</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-sm font-bold text-[#1e3a5f] italic">Artist Neelam Suthar</p>
                  <div className="w-32 border-t border-[#ccc]" />
                  <p className="text-[10px] text-[#999] font-body mt-0.5">Proprietor, Art Neelam Academy</p>
                </div>
              </div>

              {/* Certificate ID */}
              <p className="absolute bottom-3 left-6 text-[8px] text-[#ccc] font-body">{certId}</p>

              {!isEligible && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="bg-warm rounded-2xl px-6 py-4 text-center shadow-lg">
                    <p className="font-display font-bold text-foreground text-lg mb-1">Not Yet Eligible</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {student.sessionsAttended}/{student.total_sessions} sessions completed
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (student.sessionsAttended / student.total_sessions) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {students.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No students found.</p>}
    </div>
  );
}
