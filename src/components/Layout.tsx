import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserPlus, CalendarCheck, CreditCard,
  Receipt, IdCard, Bell, Settings, LogOut, Menu, X, Award
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logoImg from "@/assets/logo.png";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leads", icon: Users, label: "Leads" },
  { path: "/students", icon: UserPlus, label: "Students" },
  { path: "/attendance", icon: CalendarCheck, label: "Attendance" },
  { path: "/payments", icon: CreditCard, label: "Payments" },
  { path: "/expenses", icon: Receipt, label: "Expenses" },
  { path: "/id-card", icon: IdCard, label: "ID Cards" },
  { path: "/certificates", icon: Award, label: "Certificates" },
  { path: "/notices", icon: Bell, label: "Notices" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const bottomNav = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/leads", icon: Users, label: "Leads" },
  { path: "/students", icon: UserPlus, label: "Students" },
  { path: "/attendance", icon: CalendarCheck, label: "Attend" },
  { path: "/payments", icon: CreditCard, label: "Fees" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, role } = useAuth();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border shadow-card">
        <div className="p-6 border-b border-border">
          <a href="https://nasdemo1.lovable.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="Art Neelam" className="w-10 h-auto rounded-xl" />
            <div>
              <h1 className="font-display text-base font-bold text-foreground leading-tight">Art Neelam</h1>
              <p className="text-xs text-muted-foreground font-body">Academy Manager</p>
            </div>
          </a>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {(role === "parent" ? [] : navItems).map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(path) ? "bg-primary-soft text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          {role === "parent" ? (
            <Link to="/parent-portal"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <Users className="w-4 h-4" />
              Parent Portal
            </Link>
          ) : (
            <Link to="/parent-portal"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <Users className="w-4 h-4" />
              Parent Portal
            </Link>
          )}
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all mt-1">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="https://nasdemo1.lovable.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="Art Neelam" className="w-8 h-auto rounded-lg" />
            <span className="font-display font-bold text-foreground text-base">Art Neelam Academy</span>
          </a>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-card h-full shadow-active animate-slide-in overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <a href="https://nasdemo1.lovable.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={logoImg} alt="Art Neelam" className="w-9 h-auto rounded-xl" />
                <div>
                  <h1 className="font-display font-bold text-foreground text-sm">Art Neelam Academy</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </a>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {(role === "parent" ? [{ path: "/parent-portal", icon: Users, label: "Parent Portal" }] : [...navItems, { path: "/parent-portal", icon: Users, label: "Parent Portal" }]).map(({ path, icon: Icon, label }) => (
                <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive(path) ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide md:pt-0 pt-16 pb-20 md:pb-0">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border pb-safe">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {bottomNav.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}
              className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive(path) ? "text-primary" : "text-muted-foreground")}>
              <Icon className={cn("w-5 h-5", isActive(path) && "scale-110")} />
              <span className="text-[10px] font-medium font-body">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
