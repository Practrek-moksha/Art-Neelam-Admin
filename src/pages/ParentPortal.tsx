import { DUMMY_STUDENTS, DUMMY_ATTENDANCE, DUMMY_PAYMENTS, DUMMY_NOTICES } from "@/data/dummy";
import { CalendarCheck, CreditCard, Bell, Cake, Shield } from "lucide-react";
import { useState } from "react";

const today = new Date();

function getAttendancePct(studentId: string) {
  const totalDays = [...new Set(DUMMY_ATTENDANCE.map(r => r.date))].length;
  const presentDays = DUMMY_ATTENDANCE.filter(r => r.studentId === studentId && r.status === "present").length;
  return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
}

function getDaysUntilBirthday(dob: string) {
  const birth = new Date(dob);
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ParentPortal() {
  const [selectedStudentId, setSelectedStudentId] = useState(DUMMY_STUDENTS[0].id);
  const student = DUMMY_STUDENTS.find(s => s.id === selectedStudentId) || DUMMY_STUDENTS[0];
  
  const attendancePct = getAttendancePct(student.id);
  const daysUntilBday = getDaysUntilBirthday(student.dob);
  const studentPayments = DUMMY_PAYMENTS.filter(p => p.studentId === student.id);
  const totalPaid = studentPayments.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = studentPayments.filter(p => p.status === "pending").reduce((a, p) => a + p.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="gradient-hero rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary font-body">Parent Portal</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Hello, Parent! 👋</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Track your child's progress at Art Neelam Studio</p>
      </div>

      {/* Student Selector */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground font-body">Select Student</label>
        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}
          className="w-full mt-1 px-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
          {DUMMY_STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
        </select>
      </div>

      {/* Student Card */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-2xl">
            {student.name[0]}
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground font-body">{student.rollNumber} • {student.course}</p>
            <p className="text-xs text-muted-foreground font-body">{student.batch} batch</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground font-body">Enrolled</p>
            <p className="text-sm font-bold font-body text-foreground">{new Date(student.enrollmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-body">Valid Till</p>
            <p className="text-sm font-bold font-body text-foreground">{new Date(student.validityEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Attendance */}
        <div className="bg-card rounded-2xl shadow-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-accent-vivid" />
            <p className="text-xs font-semibold text-muted-foreground font-body">Attendance</p>
          </div>
          <div className="relative w-16 h-16 mx-auto">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--accent-vivid))" strokeWidth="6"
                strokeDasharray={`${(attendancePct / 100) * 163.4} 163.4`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold font-body text-foreground">{attendancePct}%</span>
            </div>
          </div>
          <p className={`text-center text-xs font-semibold font-body mt-2 ${attendancePct >= 75 ? "text-accent-vivid" : "text-destructive"}`}>
            {attendancePct >= 75 ? "Good" : "Needs Improvement"}
          </p>
        </div>

        {/* Birthday */}
        <div className="bg-warm rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-4 h-4 text-warm-foreground" />
            <p className="text-xs font-semibold text-warm-foreground font-body">Birthday</p>
          </div>
          <p className="font-display text-3xl font-bold text-foreground">{daysUntilBday}</p>
          <p className="text-xs text-warm-foreground font-body">days to go 🎂</p>
          <p className="text-[10px] text-muted-foreground font-body mt-2">
            {new Date(student.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Fee Status */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
          <CreditCard className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-foreground text-base">Fee Status</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-xs text-accent-foreground font-body font-semibold">Paid</p>
              <p className="font-display font-bold text-foreground text-lg mt-1">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-warm rounded-xl p-3 text-center">
              <p className="text-xs text-warm-foreground font-body font-semibold">Pending</p>
              <p className="font-display font-bold text-foreground text-lg mt-1">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-2">
            {studentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground font-body">Installment {p.installmentNo}/{p.totalInstallments}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{p.method} • {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground font-body">₹{p.amount.toLocaleString()}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "paid" ? "bg-accent text-accent-foreground" : "bg-warm text-warm-foreground"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-foreground text-base">Notices</h3>
        </div>
        <div className="p-4 space-y-3">
          {DUMMY_NOTICES.filter(n => n.audience !== "admin").map(n => (
            <div key={n.id} className="p-3 bg-primary-soft rounded-xl">
              <p className="text-sm font-bold font-body text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{n.body}</p>
              <p className="text-[10px] text-primary font-semibold font-body mt-1.5">
                {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
