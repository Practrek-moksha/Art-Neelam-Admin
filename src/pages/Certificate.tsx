import { useState, useEffect, useRef } from "react";
import { Search, Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

type StudentCert = {
  id: string; name: string; roll_number: string; course: string;
  total_sessions: number; sessionsAttended: number; feesPaid: boolean;
  status: string;
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
        supabase.from("students").select("id, name, roll_number, course, total_sessions, fee_amount, status").in("status", ["active", "new", "graduated"]),
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
      // Select first eligible, or graduated, or first student
      const eligible = enriched.filter(s => s.sessionsAttended >= s.total_sessions && s.feesPaid);
      const graduated = enriched.filter(s => s.status === "graduated");
      if (eligible.length > 0) setSelectedId(eligible[0].id);
      else if (graduated.length > 0) setSelectedId(graduated[0].id);
      else if (enriched.length > 0) setSelectedId(enriched[0].id);
      setLoading(false);
    })();
  }, []);

  const student = students.find(s => s.id === selectedId);
  const isEligible = student ? (student.sessionsAttended >= student.total_sessions && student.feesPaid) || student.status === "graduated" : false;

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  const eligibleStudents = students.filter(s => (s.sessionsAttended >= s.total_sessions && s.feesPaid) || s.status === "graduated");

  const handlePrint = () => {
    if (!isEligible) { toast.error("Student not eligible yet"); return; }
    window.print();
  };

  const certId = student ? `AN-CERT-${student.roll_number.replace(/^(NAS|ANA|AN)-/, "")}` : "";
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Certificates</h1>
          <p className="text-sm text-muted-foreground font-body">{eligibleStudents.length} students eligible</p>
        </div>
        <button onClick={handlePrint} disabled={!isEligible}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90 disabled:opacity-40">
          <Download className="w-4 h-4" /> Print Certificate
        </button>
      </div>

      <div className="print:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="print:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filtered.map(s => {
          const eligible = (s.sessionsAttended >= s.total_sessions && s.feesPaid) || s.status === "graduated";
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

      {/* Certificate */}
      {student && (
        <div className="flex justify-center">
          <div ref={certRef} id="certificate-print-area"
            className="cert-printable w-full max-w-sm rounded-lg overflow-hidden shadow-active print:shadow-none print:max-w-none print:rounded-none relative"
            style={{
              aspectRatio: "1/1.4",
              background: "linear-gradient(180deg, #fce4ec 0%, #f8bbd0 20%, #fce4ec 50%, #fff0f3 100%)",
              border: "3px solid #c9a227",
            }}>
            <div className="cert-printable absolute inset-3 border-2 rounded-sm" style={{ borderColor: "rgba(201,162,39,0.3)" }} />
            <div className="cert-printable absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: "rgba(201,162,39,0.5)" }} />
            <div className="cert-printable absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: "rgba(201,162,39,0.5)" }} />
            <div className="cert-printable absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: "rgba(201,162,39,0.5)" }} />
            <div className="cert-printable absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: "rgba(201,162,39,0.5)" }} />

            <div className="cert-printable relative h-full flex flex-col items-center justify-between px-6 py-8 print:px-16 print:py-20 text-center">
              <div>
                <h2 className="font-display text-lg md:text-xl print:text-4xl font-bold tracking-wider" style={{ color: "#1e3a5f" }}>CERTIFICATE</h2>
                <p className="text-[10px] print:text-sm font-body tracking-[0.3em] mt-0.5" style={{ color: "rgba(30,58,95,0.7)" }}>OF COMPLETION</p>
              </div>

              <img src={logoImg} alt="Art Neelam" className="w-36 print:w-56 h-auto my-2 print:my-6" />

              <p className="text-[9px] print:text-sm font-body italic max-w-xs print:max-w-md leading-relaxed" style={{ color: "#8b4560" }}>
                "Creativity takes courage, and every masterpiece begins with a single stroke."
              </p>

              <div className="space-y-2 print:space-y-4">
                <p className="text-xs print:text-base font-body" style={{ color: "#333" }}>This is to certify that</p>
                <h3 className="font-display text-xl print:text-3xl font-bold pb-1 px-6 print:px-12" style={{ color: "#1e3a5f", borderBottom: "2px solid #c9a227" }}>
                  {student.name}
                </h3>
                <p className="text-xs print:text-base font-body" style={{ color: "#333" }}>has successfully completed the</p>
                <p className="font-display text-base print:text-2xl font-bold" style={{ color: "#c9a227" }}>{student.course} Course</p>
                <p className="text-[10px] print:text-sm font-body max-w-xs print:max-w-md leading-relaxed" style={{ color: "#666" }}>
                  at Art Neelam Academy with dedication and artistic excellence.
                  We wish continued success in all future creative endeavors.
                </p>
              </div>

              <div className="flex items-end justify-between w-full mt-4 print:mt-10">
                <div className="flex flex-col items-center">
                  <p className="text-[7px] print:text-xs font-body mt-1" style={{ color: "#999" }}>{today}</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xs print:text-base font-bold italic" style={{ color: "#1e3a5f" }}>Artist Neelam Suthar</p>
                  <div className="w-28 print:w-40" style={{ borderTop: "1px solid #ccc" }} />
                  <p className="text-[9px] print:text-xs font-body mt-0.5" style={{ color: "#999" }}>Proprietor, Art Neelam Academy</p>
                </div>
              </div>

              <p className="text-[7px] print:text-[10px] font-body" style={{ color: "#ccc" }}>{certId}</p>

              {!isEligible && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center print:hidden">
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
