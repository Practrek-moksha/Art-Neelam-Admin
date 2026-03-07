import { useState, useEffect, useRef } from "react";
import { Search, Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

type StudentCert = {
  id: string; name: string; roll_number: string; course: string;
  total_sessions: number; sessionsAttended: number; feesPaid: boolean;
};

export default function Certificate() {
  const [students, setStudents] = useState<StudentCert[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [sRes, aRes, pRes] = await Promise.all([
        supabase.from("students").select("id, name, roll_number, course, total_sessions, fee_amount").eq("status", "active"),
        supabase.from("attendance").select("student_id, status"),
        supabase.from("payments").select("student_id, amount, status"),
      ]);
      if (sRes.error) toast.error("Failed to load students");
      const studs = sRes.data || [];
      const att = aRes.data || [];
      const pays = pRes.data || [];

      const counts: Record<string, number> = {};
      att.forEach(a => { if (a.status === "present") counts[a.student_id] = (counts[a.student_id] || 0) + 1; });

      const paidAmounts: Record<string, number> = {};
      pays.forEach(p => { if (p.status === "paid") paidAmounts[p.student_id] = (paidAmounts[p.student_id] || 0) + p.amount; });

      const enriched: StudentCert[] = studs.map(s => ({
        ...s,
        sessionsAttended: counts[s.id] || 0,
        feesPaid: (paidAmounts[s.id] || 0) >= (s as any).fee_amount,
      }));

      setStudents(enriched);
      const eligible = enriched.filter(s => s.sessionsAttended >= s.total_sessions && s.feesPaid);
      if (eligible.length > 0) setSelectedId(eligible[0].id);
      else if (enriched.length > 0) setSelectedId(enriched[0].id);
      setLoading(false);
    })();
  }, []);

  const student = students.find(s => s.id === selectedId);
  const isEligible = student ? student.sessionsAttended >= student.total_sessions && student.feesPaid : false;

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  const eligibleStudents = students.filter(s => s.sessionsAttended >= s.total_sessions && s.feesPaid);

  const handlePrint = () => {
    if (!isEligible) { toast.error("Student not eligible yet"); return; }
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

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filtered.map(s => {
          const eligible = s.sessionsAttended >= s.total_sessions && s.feesPaid;
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

      {/* Vertical Certificate Preview - Light Pink */}
      {student && (
        <div className="flex justify-center">
          <div ref={certRef} className="w-full max-w-sm rounded-lg overflow-hidden shadow-active print:shadow-none relative"
            style={{
              aspectRatio: "1/1.4",
              background: "linear-gradient(180deg, #fce4ec 0%, #f8bbd0 20%, #fce4ec 50%, #fff0f3 100%)",
              border: "3px solid #c9a227",
            }}>
            {/* Inner border */}
            <div className="absolute inset-3 border-2 border-[#c9a227]/30 rounded-sm" />
            {/* Corner flourishes */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#c9a227]/50 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#c9a227]/50 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#c9a227]/50 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#c9a227]/50 rounded-br-sm" />

            <div className="relative h-full flex flex-col items-center justify-between px-6 py-8 text-center">
              {/* Title */}
              <div>
                <h2 className="font-display text-lg md:text-xl font-bold text-[#1e3a5f] tracking-wider">CERTIFICATE</h2>
                <p className="text-[10px] text-[#1e3a5f]/70 font-body tracking-[0.3em] mt-0.5">OF COMPLETION</p>
              </div>

              {/* Logo */}
              <img src={logoImg} alt="Art Neelam" className="w-28 h-auto my-2" />

              {/* Quote */}
              <p className="text-[9px] text-[#8b4560] font-body italic max-w-xs leading-relaxed">
                "Creativity takes courage, and every masterpiece begins with a single stroke."
              </p>

              {/* Body */}
              <div className="space-y-2">
                <p className="text-xs text-[#333] font-body">This is to certify that</p>
                <h3 className="font-display text-xl font-bold text-[#1e3a5f] border-b-2 border-[#c9a227] pb-1 px-6">
                  {student.name}
                </h3>
                <p className="text-xs text-[#333] font-body">has successfully completed the</p>
                <p className="font-display text-base font-bold text-[#c9a227]">{student.course} Course</p>
                <p className="text-[10px] text-[#666] font-body max-w-xs leading-relaxed">
                  at Art Neelam Academy. We applaud her commitment to learning and artistic growth
                  and wish her continued success in all future creative endeavors.
                </p>
              </div>

              {/* Gold seal + Signature */}
              <div className="flex items-end justify-between w-full mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "radial-gradient(circle, #d4af37 0%, #c9a227 70%, #b8941f 100%)", boxShadow: "0 2px 10px rgba(201,162,39,0.4)" }}>
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-[7px] text-[#999] font-body mt-1">{today}</p>
                </div>

                <div className="text-center">
                  <p className="font-display text-xs font-bold text-[#1e3a5f] italic">Artist Neelam Suthar</p>
                  <div className="w-28 border-t border-[#ccc]" />
                  <p className="text-[9px] text-[#999] font-body mt-0.5">Proprietor, Art Neelam Academy</p>
                </div>
              </div>

              <p className="text-[7px] text-[#ccc] font-body">{certId}</p>

              {!isEligible && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="bg-warm rounded-2xl px-6 py-4 text-center shadow-lg">
                    <p className="font-display font-bold text-foreground text-lg mb-1">Not Yet Eligible</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {student.sessionsAttended}/{student.total_sessions} sessions
                      {!student.feesPaid && " • Fees pending"}
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
