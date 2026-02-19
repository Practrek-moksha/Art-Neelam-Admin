import { useState } from "react";
import { DUMMY_STUDENTS, DUMMY_ATTENDANCE, AttendanceRecord, BATCHES } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Status = "present" | "absent" | "late";

const statusConfig: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  present: { label: "P", color: "text-green-700", bg: "bg-accent", dot: "bg-green-400" },
  absent: { label: "A", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-400" },
  late: { label: "L", color: "text-amber-700", bg: "bg-warm", dot: "bg-amber-400" },
};

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(DUMMY_ATTENDANCE);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date("2024-02-19")));
  const [selectedBatch, setSelectedBatch] = useState("All");

  const shiftDate = (d: number) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(formatDate(dt));
  };

  const getStatus = (studentId: string): Status | null => {
    const r = records.find(r => r.studentId === studentId && r.date === selectedDate);
    return r ? r.status as Status : null;
  };

  const markAttendance = (studentId: string, status: Status, batch: string) => {
    setRecords(prev => {
      const existing = prev.findIndex(r => r.studentId === studentId && r.date === selectedDate);
      if (existing >= 0) {
        return prev.map((r, i) => i === existing ? { ...r, status } : r);
      }
      return [...prev, { studentId, date: selectedDate, status, batch }];
    });
  };

  const filteredStudents = DUMMY_STUDENTS.filter(s =>
    selectedBatch === "All" || s.batch === selectedBatch
  );

  const presentCount = filteredStudents.filter(s => getStatus(s.id) === "present").length;
  const absentCount = filteredStudents.filter(s => getStatus(s.id) === "absent").length;
  const lateCount = filteredStudents.filter(s => getStatus(s.id) === "late").length;

  const markAll = (status: Status) => {
    filteredStudents.forEach(s => markAttendance(s.id, status, s.batch));
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Attendance</h1>

      {/* Date Picker */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => shiftDate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center">
            <p className="font-display font-bold text-foreground text-lg">
              {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-muted-foreground font-body">{new Date(selectedDate).getFullYear()}</p>
          </div>
          <button onClick={() => shiftDate(1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
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
            {b}
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
                  {status && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${statusConfig[status].dot}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold font-body text-foreground">{student.name}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{student.rollNumber} • {student.batch}</p>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance History Summary */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-base mb-3">Student Attendance %</h3>
        <div className="space-y-3">
          {DUMMY_STUDENTS.map(s => {
            const totalDays = [...new Set(records.map(r => r.date))].length;
            const presentDays = records.filter(r => r.studentId === s.id && r.status === "present").length;
            const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-xs flex-shrink-0">
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold font-body text-foreground truncate">{s.name}</p>
                    <span className={`text-xs font-bold font-body ml-2 ${pct >= 75 ? "text-accent-vivid" : pct >= 50 ? "text-warm-vivid" : "text-destructive"}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-accent-vivid" : pct >= 50 ? "bg-warm-vivid" : "bg-destructive"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
