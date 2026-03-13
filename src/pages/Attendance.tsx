import { useState, useEffect, useMemo } from "react";
import { BATCHES } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Send, Save, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "present" | "absent" | "bank_holiday" | "class_holiday";
type StudentBasic = { id: string; name: string; roll_number: string; batch: string; whatsapp: string; total_sessions: number };
type AttendanceRow = { id: string; student_id: string; date: string; status: string; batch: string | null };

const statusConfig: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: "P", color: "text-green-700", bg: "bg-accent", dot: "bg-green-400" },
  absent: { label: "A", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-400" },
  bank_holiday: { label: "B", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-400" },
  class_holiday: { label: "C", color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-400" },
};

function formatDate(d: Date) { return d.toISOString().slice(0, 10); }

export default function Attendance() {
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [showView, setShowView] = useState<"daily" | "month" | "calendar">("daily");

  useEffect(() => {
    (async () => {
      const [sRes, aRes] = await Promise.all([
        supabase.from("students").select("id, name, roll_number, batch, whatsapp, total_sessions").in("status", ["active", "new"]),
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
    setPendingChanges({});
  };

  const getStatus = (studentId: string): Status | null => {
    if (pendingChanges[studentId]) return pendingChanges[studentId];
    const r = records.find(r => r.student_id === studentId && r.date === selectedDate);
    return r ? r.status as Status : null;
  };

  const getSessionsUsed = (studentId: string): number => {
    return records.filter(r => r.student_id === studentId && (r.status === "present")).length;
  };

  const markLocal = (studentId: string, status: Status) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    // Check session limit for present marking
    if (status === "present") {
      const used = getSessionsUsed(studentId);
      const existingOnDate = records.find(r => r.student_id === studentId && r.date === selectedDate);
      const isAlreadyPresent = existingOnDate?.status === "present" || pendingChanges[studentId] === "present";
      if (!isAlreadyPresent && used >= student.total_sessions) {
        toast.error(`${student.name} has used all ${student.total_sessions} sessions`);
        return;
      }
    }
    setPendingChanges(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllLocal = (status: Status) => {
    const changes: Record<string, Status> = {};
    filteredStudents.forEach(s => {
      if (status === "present") {
        const used = getSessionsUsed(s.id);
        const existingOnDate = records.find(r => r.student_id === s.id && r.date === selectedDate);
        const isAlreadyPresent = existingOnDate?.status === "present" || pendingChanges[s.id] === "present";
        if (!isAlreadyPresent && used >= s.total_sessions) return;
      }
      changes[s.id] = status;
    });
    setPendingChanges(prev => ({ ...prev, ...changes }));
  };

  const checkConsecutiveAbsents = (studentId: string, allRecords: AttendanceRow[]) => {
    const studentRecords = allRecords
      .filter(r => r.student_id === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
    let consecutive = 0;
    for (const r of studentRecords) {
      if (r.status === "absent") consecutive++;
      else break;
    }
    return consecutive >= 4;
  };

  const saveAttendance = async () => {
    if (Object.keys(pendingChanges).length === 0) { toast("No changes to save"); return; }
    setSaving(true);
    try {
      const updatedRecords = [...records];
      for (const [studentId, status] of Object.entries(pendingChanges)) {
        const student = students.find(s => s.id === studentId);
        const existing = updatedRecords.find(r => r.student_id === studentId && r.date === selectedDate);
        if (existing) {
          await supabase.from("attendance").update({ status }).eq("id", existing.id);
          const idx = updatedRecords.findIndex(r => r.id === existing.id);
          if (idx >= 0) updatedRecords[idx] = { ...updatedRecords[idx], status };
        } else {
          const { data, error } = await supabase.from("attendance").insert({
            student_id: studentId, date: selectedDate, status, batch: student?.batch || null
          }).select().single();
          if (!error && data) updatedRecords.push(data);
        }
      }
      setRecords(updatedRecords);

      // Auto-flag inactive after 4 consecutive absents OR graduate if all sessions done + fees paid
      for (const studentId of Object.keys(pendingChanges)) {
        if (checkConsecutiveAbsents(studentId, updatedRecords)) {
          const student = students.find(s => s.id === studentId);
          await supabase.from("students").update({ status: "inactive" }).eq("id", studentId);
          if (student) toast.warning(`${student.name} marked inactive (4+ consecutive absences)`);
        } else {
          // Check if student completed all sessions
          const student = students.find(s => s.id === studentId);
          if (student) {
            const sessionsUsed = updatedRecords.filter(r => r.student_id === studentId && r.status === "present").length;
            if (sessionsUsed >= student.total_sessions) {
              // Check if fees fully paid
              const { data: pmts } = await supabase.from("payments").select("amount, status").eq("student_id", studentId);
              const totalPaid = (pmts || []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);
              const { data: stData } = await supabase.from("students").select("fee_amount, status").eq("id", studentId).single();
              if (stData && totalPaid >= stData.fee_amount && stData.status !== "graduated") {
                await supabase.from("students").update({ status: "graduated" }).eq("id", studentId);
                toast.success(`🎓 ${student.name} has graduated! All sessions & fees complete.`);
              }
            }
          }
        }
      }

      setPendingChanges({});
      toast.success("Attendance saved!");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const sendAllAlerts = () => {
    filteredStudents.forEach(student => {
      const status = getStatus(student.id);
      if (status && (status === "present" || status === "absent")) {
        const dateStr = new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        openWhatsApp(student.whatsapp, templates.attendanceAlert(student.name, dateStr, status));
      }
    });
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
  const hasChanges = Object.keys(pendingChanges).length > 0;

  // Month summary
  const selectedMonth = selectedDate.slice(0, 7);
  const monthRecords = records.filter(r => r.date.startsWith(selectedMonth));

  const monthSummary = useMemo(() => {
    const summary: Record<string, { present: number; absent: number; total: number }> = {};
    filteredStudents.forEach(s => { summary[s.id] = { present: 0, absent: 0, total: s.total_sessions }; });
    monthRecords.forEach(r => {
      if (summary[r.student_id]) {
        if (r.status === "present") summary[r.student_id].present++;
        if (r.status === "absent") summary[r.student_id].absent++;
      }
    });
    return summary;
  }, [filteredStudents, monthRecords]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = parseInt(selectedDate.slice(0, 4));
    const month = parseInt(selectedDate.slice(5, 7)) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: { date: string; day: number; present: number; absent: number; holiday: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayRecords = records.filter(r => r.date === dateStr);
      days.push({
        date: dateStr, day: d,
        present: dayRecords.filter(r => r.status === "present").length,
        absent: dayRecords.filter(r => r.status === "absent").length,
        holiday: dayRecords.some(r => r.status === "bank_holiday" || r.status === "class_holiday"),
      });
    }
    return { days, firstDay };
  }, [selectedDate, records]);

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Attendance</h1>
        <div className="flex bg-muted rounded-lg p-1">
          {(["daily", "month", "calendar"] as const).map(v => (
            <button key={v} onClick={() => setShowView(v)}
              className={cn("px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all", showView === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              {v}
            </button>
          ))}
        </div>
      </div>

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
        <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setPendingChanges({}); }}
          className="w-full mt-3 px-3 py-2 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Present", count: presentCount, color: "bg-accent", textColor: "text-accent-foreground" },
          { label: "Absent", count: absentCount, color: "bg-red-50", textColor: "text-red-700" },
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

      {showView === "daily" && (
        <>
          {/* Quick Mark All + Save */}
          <div className="flex gap-2 flex-wrap">
            {(["present", "absent", "bank_holiday", "class_holiday"] as Status[]).map(s => (
              <button key={s} onClick={() => markAllLocal(s)}
                className={cn("flex-1 py-2 rounded-xl text-xs font-semibold font-body transition-all min-w-[60px]", statusConfig[s].bg, statusConfig[s].color, "hover:opacity-80")}>
                All {statusConfig[s].label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={saveAttendance} disabled={!hasChanges || saving}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold font-body transition-all",
                hasChanges ? "gradient-primary text-primary-foreground shadow-active" : "bg-muted text-muted-foreground")}>
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {hasChanges ? `Save (${Object.keys(pendingChanges).length} changes)` : "No changes"}
            </button>
            <button onClick={sendAllAlerts}
              className="px-4 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold font-body hover:opacity-80">
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Student List */}
          <div className="space-y-2">
            {filteredStudents.map(student => {
              const status = getStatus(student.id);
              const sessionsUsed = getSessionsUsed(student.id);
              const sessionsLeft = student.total_sessions - sessionsUsed;
              const isPending = !!pendingChanges[student.id];
              return (
                <div key={student.id} className={cn("bg-card rounded-2xl shadow-card border p-3 transition-all",
                  isPending ? "border-primary/50 ring-1 ring-primary/20" : "border-border")}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-base">
                        {student.name[0]}
                      </div>
                      {status && <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${statusConfig[status].dot}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-body text-foreground">{student.name}</p>
                      <p className="text-[10px] text-muted-foreground font-body">
                        {student.roll_number} • {student.batch.split(" (")[0]} • <span className={sessionsLeft <= 3 ? "text-destructive font-semibold" : ""}>{sessionsLeft} left</span>
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {(["present", "absent", "bank_holiday", "class_holiday"] as Status[]).map(s => (
                        <button key={s} onClick={() => markLocal(student.id, s)}
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
        </>
      )}

      {/* Month Summary */}
      {showView === "month" && (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display font-bold text-foreground text-sm">
              {new Date(selectedDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} Summary
            </h3>
          </div>
          <div className="divide-y divide-border">
            {filteredStudents.map(s => {
              const data = monthSummary[s.id] || { present: 0, absent: 0, total: 0 };
              const pct = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-sm">{s.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-body text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{s.roll_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-green-700 font-body">{data.present}P</span>
                    <span className="text-xs font-semibold text-red-700 font-body">{data.absent}A</span>
                    <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-foreground font-body w-8">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {showView === "calendar" && (
        <div className="bg-card rounded-2xl shadow-card border border-border p-4">
          <h3 className="font-display font-bold text-foreground text-sm mb-3">
            {new Date(selectedDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-[10px] font-semibold text-muted-foreground font-body py-1">{d}</div>
            ))}
            {Array(calendarDays.firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {calendarDays.days.map(day => (
              <button key={day.date} onClick={() => { setSelectedDate(day.date); setShowView("daily"); setPendingChanges({}); }}
                className={cn("rounded-lg p-1 transition-all text-center",
                  day.date === selectedDate ? "ring-2 ring-primary bg-primary-soft" :
                  day.holiday ? "bg-blue-50" : "hover:bg-muted")}>
                <p className="text-xs font-bold text-foreground font-body">{day.day}</p>
                {(day.present > 0 || day.absent > 0) && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {day.present > 0 && <span className="text-[8px] text-green-600 font-bold">{day.present}</span>}
                    {day.absent > 0 && <span className="text-[8px] text-red-600 font-bold">{day.absent}</span>}
                  </div>
                )}
                {day.holiday && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mx-auto mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
