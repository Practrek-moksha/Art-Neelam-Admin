import { DUMMY_LEADS, DUMMY_STUDENTS, DUMMY_PAYMENTS, DUMMY_ATTENDANCE, DUMMY_NOTICES } from "@/data/dummy";
import { Users, UserPlus, IndianRupee, CalendarCheck, Cake, TrendingUp, MessageCircle, Phone, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsApp, templates } from "@/lib/whatsapp";

const today = new Date();

function getAge(dob: string) {
  const birth = new Date(dob);
  const diff = today.getTime() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function getUpcomingBirthdays() {
  return DUMMY_STUDENTS.filter((s) => {
    const dob = new Date(s.dob);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = thisYear.getTime() - today.getTime();
    return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  });
}

const stats = [
  {
    label: "Total Leads",
    value: DUMMY_LEADS.length,
    sub: `${DUMMY_LEADS.filter(l => l.status === "new").length} new`,
    icon: Users,
    color: "bg-secondary text-secondary-foreground",
    iconBg: "bg-secondary",
  },
  {
    label: "Active Students",
    value: DUMMY_STUDENTS.filter(s => s.status === "active").length,
    sub: `${DUMMY_STUDENTS.length} total`,
    icon: UserPlus,
    color: "bg-primary-soft text-primary",
    iconBg: "bg-primary-soft",
  },
  {
    label: "Revenue (Feb)",
    value: "₹" + DUMMY_PAYMENTS.filter(p => p.status === "paid" && p.date.startsWith("2024-02")).reduce((a, p) => a + p.amount, 0).toLocaleString(),
    sub: "Collected",
    icon: IndianRupee,
    color: "bg-accent text-accent-foreground",
    iconBg: "bg-accent",
  },
  {
    label: "Attendance Today",
    value: DUMMY_ATTENDANCE.filter(a => a.date === "2024-02-19" && a.status === "present").length,
    sub: `of ${DUMMY_STUDENTS.length} students`,
    icon: CalendarCheck,
    color: "bg-warm text-warm-foreground",
    iconBg: "bg-warm",
  },
];

const recentLeads = DUMMY_LEADS.slice(0, 4);
const upcomingBirthdays = getUpcomingBirthdays();

const statusColors: Record<string, string> = {
  new: "bg-secondary text-secondary-foreground",
  "follow-up": "bg-warm text-warm-foreground",
  demo: "bg-primary-soft text-primary",
  converted: "bg-accent text-accent-foreground",
  lost: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Good Morning! 🎨
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-body">
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link to="/notices" className="relative p-2.5 bg-card rounded-xl border border-border shadow-sm hover:shadow-card transition-all">
          <Bell className="w-5 h-5 text-primary" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
            {DUMMY_NOTICES.length}
          </span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
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

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Leads */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-display font-bold text-foreground text-base">Recent Leads</h2>
            </div>
            <Link to="/leads" className="text-xs text-primary font-semibold hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-border">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground text-sm flex-shrink-0">
                  {lead.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate font-body">{lead.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{lead.course} • {lead.source}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColors[lead.status]}`}>
                    {lead.status}
                  </span>
                  <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                    <Phone className="w-3.5 h-3.5 text-accent-vivid" />
                  </a>
                  <button onClick={() => openWhatsApp(lead.phone, templates.followUp(lead.name, lead.course))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                    <MessageCircle className="w-3.5 h-3.5 text-accent-vivid" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
            <Cake className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-foreground text-base">Upcoming Birthdays</h2>
          </div>
          <div className="p-4">
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center py-8">
                <Cake className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground font-body">No birthdays in next 30 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-warm rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-warm-vivid/20 flex items-center justify-center">
                      <Cake className="w-4 h-4 text-warm-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-body text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {new Date(s.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • Turning {getAge(s.dob) + 1}
                      </p>
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
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-foreground text-base">Noticeboard</h2>
          </div>
          <Link to="/notices" className="text-xs text-primary font-semibold hover:underline">Manage</Link>
        </div>
        <div className="p-4 space-y-2">
          {DUMMY_NOTICES.map((n) => (
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
        </div>
      </div>
    </div>
  );
}
