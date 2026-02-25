import { useState, useEffect } from "react";
import { BATCHES } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "present" | "absent" | "late";
type StudentBasic = { id: string; name: string; roll_number: string; batch: string; whatsapp: string };
type AttendanceRow = { id: string; student_id: string; date: string; status: string; batch: string | null };

const statusConfig: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: "P", color: "text-green-700", bg: "bg-accent", dot: "bg-green-400" },
  absent: { label: "A", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-400" },
  late: { label: "L", color: "text-amber-700", bg: "bg-warm", dot: "bg-amber-400" },
};

function formatDate(d: Date) { return d.toISOString().slice(0, 10); }

export default function Attendance() {
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sRes, aRes] = await Promise.all([
        supabase.from("students").select("id, name, roll_number, batch, whatsapp").eq("status", "active"),
        supabase.from("attendance").select("*"),
      ]);
      if (sRes.error) toast.error("Failed to load students");
      if (aRes.error) toast.error("Failed to load attendance");
      setStudents(sRes.data || []);
      setRecords(aRes.data || []);
      setLoading(false);
    })();
  }, []);

  const shiftDate = (d: number) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(formatDate(dt));
  };

  const getStatus = (studentId: string): Status | null => {
    const r = records.find(r => r.student_id === studentId && r.date === selectedDate);
    return r ? r.status as Status : null;
  };

  const markAttendance = async (studentId: string, status: Status, batch: string) => {
    const existing = records.find(r => r.student_id === studentId && r.date === selectedDate);
    if (existing) {
      setRecords(prev => prev.map(r => r.id === existing.id ? { ...r, status } : r));
      await supabase.from("attendance").update({ status }).eq("id", existing.id);
    } else {
      const { data, error } = await supabase.from("attendance").insert({ student_id: studentId, date: selectedDate, status, batch }).select().single();
      if (error) { toast.error("Failed to save"); return; }
      setRecords(prev => [...prev, data]);
    }
  };

  const sendAttendanceAlert = (studentId: string, status: Status) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const dateStr = new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    openWhatsApp(student.whatsapp, templates.attendanceAlert(student.name, dateStr, status));
  };

  const filteredStudents = students.filter(s => selectedBatch === "All" || s.batch === selectedBatch);
  const presentCount = filteredStudents.filter(s => getStatus(s.id) === "present").length;
  const absentCount = filteredStudents.filter(s => getStatus(s.id) === "absent").length;
  const lateCount = filteredStudents.filter(s => getStatus(s.id) === "late").length;

  const markAll = (status: Status) => { filteredStudents.forEach(s => markAttendance(s.id, status, s.batch)); };

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Attendance</h1>

      {/* Date Picker */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => shiftDate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
          <div className="text-center">
            <p className="font-display font-bold text-foreground text-lg">
              {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-muted-foreground font-body">{new Date(selectedDate).getFullYear()}</p>
          </div>
          <button onClick={() => shiftDate(1)} className="p-2 rounded-xl hover:bg-muted transition-colors"><ChevronRight className="w-5 h-5 text-foreground" /></button>
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="w-full mt-3 px-3 py-2 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Present", count: presentCount, color: "bg-accent", textColor: "text-accent-foreground" },
          { label: "Absent", count: absentCount, color: "bg-red-50", textColor: "text-red-700" },
          { label: "Late", count: lateCount, color: "bg-warm", textColor: "text-warm-foreground" },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <p className={`font-display text-2xl font-bold ${s.textColor}`}>{s.count}</p>
            <p className={`text-xs font-semibold ${s.textColor} font-body`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Batch Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", ...BATCHES].map(b => (
          <button key={b} onClick={() => setSelectedBatch(b)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold font-body transition-all",
              selectedBatch === b ? "gradient-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary")}>
            {b.split(" (")[0]}
          </button>
        ))}
      </div>

      {/* Quick Mark All */}
      <div className="flex gap-2">
        {(["present", "absent", "late"] as Status[]).map(s => (
          <button key={s} onClick={() => markAll(s)}
            className={cn("flex-1 py-2 rounded-xl text-xs font-semibold font-body transition-all",
              s === "present" ? "bg-accent text-accent-foreground hover:opacity-80" :
              s === "absent" ? "bg-red-50 text-red-700 hover:opacity-80" :
              "bg-warm text-warm-foreground hover:opacity-80")}>
            All {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.map(student => {
          const status = getStatus(student.id);
          return (
            <div key={student.id} className="bg-card rounded-2xl shadow-card border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-base">
                    {student.name[0]}
                  </div>
                  {status && <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${statusConfig[status].dot}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-body text-foreground">{student.name}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{student.roll_number} • {student.batch.split(" (")[0]}</p>
                </div>
                <div className="flex gap-1.5">
                  {(["present", "absent", "late"] as Status[]).map(s => (
                    <button key={s} onClick={() => markAttendance(student.id, s, student.batch)}
                      className={cn("w-9 h-9 rounded-xl text-xs font-bold font-body transition-all",
                        status === s ? `${statusConfig[s].bg} ${statusConfig[s].color} shadow-sm scale-105` :
                        "bg-muted text-muted-foreground hover:opacity-80")}>
                      {statusConfig[s].label}
                    </button>
                  ))}
                  {status && (
                    <button onClick={() => sendAttendanceAlert(student.id, status)}
                      className="w-9 h-9 rounded-xl bg-primary-soft text-primary text-xs hover:opacity-80 transition-all flex items-center justify-center" title="Send WhatsApp alert">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredStudents.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No students found.</p>}
      </div>
    </div>
  );
}
