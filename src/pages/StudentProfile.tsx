import { useParams, Link } from "react-router-dom";
import { DUMMY_STUDENTS, DUMMY_ATTENDANCE, DUMMY_PAYMENTS } from "@/data/dummy";
import { ArrowLeft, Phone, MessageCircle, IdCard, Calendar, CreditCard, User, BookOpen, Clock, Send } from "lucide-react";
import { openWhatsApp, templates } from "@/lib/whatsapp";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const student = DUMMY_STUDENTS.find(s => s.id === id);

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students" className="text-primary underline text-sm mt-2 inline-block">← Back to Students</Link>
      </div>
    );
  }

  const attendance = DUMMY_ATTENDANCE.filter(a => a.studentId === id);
  const present = attendance.filter(a => a.status === "present").length;
  const late = attendance.filter(a => a.status === "late").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const totalMarked = attendance.length;
  const attendancePercent = totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0;

  const sessionsAttended = present + late;
  const sessionsRemaining = Math.max(0, student.totalSessions - sessionsAttended);

  const payments = DUMMY_PAYMENTS.filter(p => p.studentId === id);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const feeProgress = student.feeAmount > 0 ? Math.round((totalPaid / student.feeAmount) * 100) : 0;

  const validityEnd = new Date(student.validityEnd);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((validityEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const courseColors: Record<string, string> = {
    Basic: "bg-accent text-accent-foreground",
    Advanced: "bg-secondary text-secondary-foreground",
    Professional: "bg-primary-soft text-primary",
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/students" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground">Student Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-2xl flex-shrink-0">
            {student.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-lg">{student.name}</h2>
            <p className="text-xs text-muted-foreground font-body">{student.rollNumber}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${courseColors[student.course]}`}>{student.course}</span>
              <span className="text-[10px] text-muted-foreground font-body">{student.batch}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${student.status === "active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {student.status}
              </span>
            </div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <a href={`tel:${student.whatsapp}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-80 transition-opacity">
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.customMessage(student.name))}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-80 transition-opacity">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <Link to={`/id-card?id=${student.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:opacity-80 transition-opacity">
            <IdCard className="w-3.5 h-3.5" /> ID Card
          </Link>
        </div>
        {/* Quick WhatsApp Templates */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => openWhatsApp(student.whatsapp, templates.feeReminder(student.name, totalPending))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-warm text-warm-foreground text-[10px] font-semibold hover:opacity-80">
            <Send className="w-3 h-3" /> Fee Reminder
          </button>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.birthdayWish(student.name))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-soft text-primary text-[10px] font-semibold hover:opacity-80">
            <Send className="w-3 h-3" /> Birthday Wish
          </button>
          <button onClick={() => openWhatsApp(student.whatsapp, templates.welcomeStudent(student.name, student.course, student.batch))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:opacity-80">
            <Send className="w-3 h-3" /> Welcome Msg
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={BookOpen} label="Sessions Left" value={String(sessionsRemaining)} sub={`of ${student.totalSessions} total`} color="primary" />
        <StatCard icon={Calendar} label="Attendance" value={`${attendancePercent}%`} sub={`${present}P · ${late}L · ${absent}A`} color="accent" />
        <StatCard icon={CreditCard} label="Fees Paid" value={`₹${totalPaid.toLocaleString()}`} sub={`${feeProgress}% of ₹${student.feeAmount.toLocaleString()}`} color="secondary" />
        <StatCard icon={Clock} label="Validity" value={`${daysLeft}d`} sub={new Date(student.validityEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} color={daysLeft < 30 ? "destructive" : "accent"} />
      </div>

      {/* Fee Progress Bar */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Fee Progress</h3>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${feeProgress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-body">
          <span>Paid: ₹{totalPaid.toLocaleString()}</span>
          <span>Pending: ₹{totalPending.toLocaleString()}</span>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Personal Details</h3>
        <div className="space-y-2.5">
          <DetailRow label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
          <DetailRow label="School" value={student.schoolName || "—"} />
          <DetailRow label="Address" value={student.address || "—"} />
          <DetailRow label="Email" value={student.email || "—"} />
          <DetailRow label="Emergency Contact" value={student.emergencyContact || "—"} />
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Parent / Guardian</h3>
        <div className="space-y-2.5">
          <DetailRow label="Father" value={student.fatherName || "—"} sub={student.fatherContact} />
          <DetailRow label="Mother" value={student.motherName || "—"} sub={student.motherContact} />
          {student.guardianName && <DetailRow label="Guardian" value={student.guardianName} />}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground font-body">₹{p.amount.toLocaleString()} · {p.method}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })} · Instalment {p.installmentNo}/{p.totalInstallments}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "paid" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Log */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-4 mb-6">
        <h3 className="font-display font-bold text-foreground text-sm mb-3">Recent Attendance</h3>
        {attendance.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">No attendance recorded.</p>
        ) : (
          <div className="space-y-1.5">
            {attendance.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-foreground font-body">{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  a.status === "present" ? "bg-accent text-accent-foreground" :
                  a.status === "late" ? "bg-secondary text-secondary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === "primary" ? "bg-primary-soft" : color === "accent" ? "bg-accent" : color === "destructive" ? "bg-destructive/10" : "bg-secondary"}`}>
          <Icon className={`w-4 h-4 ${color === "primary" ? "text-primary" : color === "accent" ? "text-accent-foreground" : color === "destructive" ? "text-destructive" : "text-secondary-foreground"}`} />
        </div>
      </div>
      <p className="font-display font-bold text-foreground text-lg">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{sub}</p>
    </div>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground font-body">{label}</span>
      <div className="text-right">
        <span className="text-xs font-semibold text-foreground font-body">{value}</span>
        {sub && <p className="text-[10px] text-muted-foreground font-body">{sub}</p>}
      </div>
    </div>
  );
}
