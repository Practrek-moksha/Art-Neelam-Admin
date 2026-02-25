import { useState, useEffect } from "react";
import { Users, UserPlus, IndianRupee, CalendarCheck, Cake, TrendingUp, MessageCircle, Phone, Bell, Award, AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

const today = new Date();

const statusColors: Record<string, string> = {
  new: "bg-secondary text-secondary-foreground",
  contacted: "bg-warm text-warm-foreground",
  converted: "bg-accent text-accent-foreground",
  "not-interested": "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, newLeads: 0, activeStudents: 0, totalStudents: 0, revenue: 0, attendanceToday: 0, noticeCount: 0 });
  const [automation, setAutomation] = useState({ feesDueSoon: 0, overduePayments: 0, certificatesReady: 0, expiredValidity: 0 });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [leadsRes, studentsRes, paymentsRes, attendanceRes, noticesRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("students").select("id, name, dob, status, whatsapp, total_sessions, validity_end"),
        supabase.from("payments").select("amount, status, date, student_id"),
        supabase.from("attendance").select("student_id, date, status"),
        supabase.from("notices").select("*").order("date", { ascending: false }).limit(3),
      ]);

      const leads = leadsRes.data || [];
      const students = studentsRes.data || [];
      const payments = paymentsRes.data || [];
      const attendance = attendanceRes.data || [];
      const noticesList = noticesRes.data || [];
      const todayStr = today.toISOString().slice(0, 10);
      const todayAttendance = attendance.filter(a => a.date === todayStr);

      const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const monthRevenue = payments.filter(p => p.status === "paid" && p.date.startsWith(monthKey)).reduce((a, p) => a + p.amount, 0);

      // Upcoming birthdays (next 30 days)
      const bdays = students.filter(s => {
        if (!s.dob) return false;
        const dob = new Date(s.dob);
        const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        const diff = thisYear.getTime() - today.getTime();
        return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
      });

      // Automation stats
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 3); // Due within 3 days
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const pendingPayments = payments.filter(p => p.status === "pending");
      const feesDueSoon = pendingPayments.filter(p => p.date <= tomorrowStr && p.date >= todayStr).length;
      const overduePayments = pendingPayments.filter(p => p.date < todayStr).length;

      // Certificate ready: students who attended >= total_sessions
      const studentAttendanceCounts: Record<string, number> = {};
      attendance.forEach(a => {
        if (a.status === "present" || a.status === "late") {
          studentAttendanceCounts[a.student_id] = (studentAttendanceCounts[a.student_id] || 0) + 1;
        }
      });
      const certificatesReady = students.filter(s =>
        s.status === "active" && studentAttendanceCounts[s.id] >= s.total_sessions
      ).length;

      // Expired validity
      const expiredValidity = students.filter(s =>
        s.status === "active" && s.validity_end && s.validity_end < todayStr
      ).length;

      setStats({
        leads: leads.length,
        newLeads: leads.filter(l => l.status === "new").length,
        activeStudents: students.filter(s => s.status === "active").length,
        totalStudents: students.length,
        revenue: monthRevenue,
        attendanceToday: todayAttendance.filter(a => a.status === "present").length,
        noticeCount: noticesList.length,
      });
      setAutomation({ feesDueSoon, overduePayments, certificatesReady, expiredValidity });
      setRecentLeads(leads.slice(0, 4));
      setUpcomingBirthdays(bdays);
      setNotices(noticesList);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const statCards = [
    { label: "Total Leads", value: stats.leads, sub: `${stats.newLeads} new`, icon: Users, iconBg: "bg-secondary" },
    { label: "Active Students", value: stats.activeStudents, sub: `${stats.totalStudents} total`, icon: UserPlus, iconBg: "bg-primary-soft" },
    { label: "Revenue (Month)", value: "₹" + stats.revenue.toLocaleString(), sub: "Collected", icon: IndianRupee, iconBg: "bg-accent" },
    { label: "Attendance Today", value: stats.attendanceToday, sub: `of ${stats.totalStudents} students`, icon: CalendarCheck, iconBg: "bg-warm" },
  ];

  const automationCards = [
    { label: "Active Students", value: stats.activeStudents, icon: Users, color: "bg-accent", textColor: "text-accent-foreground", emoji: "🟢" },
    { label: "Fees Due Soon", value: automation.feesDueSoon, icon: Clock, color: "bg-warm", textColor: "text-warm-foreground", emoji: "🟡" },
    { label: "Overdue Payments", value: automation.overduePayments, icon: AlertTriangle, color: "bg-destructive/10", textColor: "text-destructive", emoji: "🔴" },
    { label: "Certificates Ready", value: automation.certificatesReady, icon: Award, color: "bg-secondary", textColor: "text-secondary-foreground", emoji: "🎓" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Good Morning! 🎨</h1>
          <p className="text-muted-foreground text-sm mt-1 font-body">
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link to="/notices" className="relative p-2.5 bg-card rounded-xl border border-border shadow-sm hover:shadow-card transition-all">
          <Bell className="w-5 h-5 text-primary" />
          {stats.noticeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
              {stats.noticeCount}
            </span>
          )}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-display text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-primary font-semibold font-body mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Automation Overview */}
      <div>
        <h2 className="font-display font-bold text-foreground text-base mb-3">Automation Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {automationCards.map(card => (
            <div key={card.label} className={`${card.color} rounded-2xl p-4`}>
              <p className="text-lg mb-1">{card.emoji}</p>
              <p className={`font-display text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              <p className={`text-xs font-semibold ${card.textColor} font-body`}>{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Leads */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><h2 className="font-display font-bold text-foreground text-base">Recent Leads</h2></div>
            <Link to="/leads" className="text-xs text-primary font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-border">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground text-sm flex-shrink-0">{lead.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate font-body">{lead.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{lead.course} • {lead.source}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[lead.status] || ""}`}>{lead.status}</span>
                  <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Phone className="w-3.5 h-3.5 text-accent-vivid" /></a>
                  <button onClick={() => lead.phone && openWhatsApp(lead.phone, templates.followUp(lead.name, lead.course || ""))} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><MessageCircle className="w-3.5 h-3.5 text-accent-vivid" /></button>
                </div>
              </div>
            ))}
            {recentLeads.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">No leads yet</p>}
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border"><Cake className="w-4 h-4 text-primary" /><h2 className="font-display font-bold text-foreground text-base">Upcoming Birthdays</h2></div>
          <div className="p-4">
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-8"><Cake className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground font-body">No birthdays in next 30 days</p></div>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-warm rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-warm-vivid/20 flex items-center justify-center"><Cake className="w-4 h-4 text-warm-foreground" /></div>
                    <div>
                      <p className="text-sm font-semibold font-body text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{s.dob && new Date(s.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Notices */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /><h2 className="font-display font-bold text-foreground text-base">Noticeboard</h2></div>
          <Link to="/notices" className="text-xs text-primary font-semibold hover:underline">Manage</Link>
        </div>
        <div className="p-4 space-y-2">
          {notices.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-3 bg-primary-soft rounded-xl">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold font-body text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground font-body line-clamp-1">{n.body}</p>
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0 font-body">
                {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
          {notices.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No notices</p>}
        </div>
      </div>
    </div>
  );
}
