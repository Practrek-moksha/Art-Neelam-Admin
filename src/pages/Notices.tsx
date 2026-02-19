import { useState } from "react";
import { DUMMY_NOTICES, Notice } from "@/data/dummy";
import { Plus, Bell, X, Trash2 } from "lucide-react";

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>(DUMMY_NOTICES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" as const });

  const addNotice = () => {
    if (!form.title || !form.body) return;
    const id = `N${String(notices.length + 1).padStart(3, "0")}`;
    setNotices(prev => [{ ...form, id, date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setShowForm(false);
    setForm({ title: "", body: "", audience: "all" });
  };

  const deleteNotice = (id: string) => setNotices(prev => prev.filter(n => n.id !== id));

  const audienceColors: Record<string, string> = {
    all: "bg-accent text-accent-foreground",
    parents: "bg-secondary text-secondary-foreground",
    admin: "bg-primary-soft text-primary",
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Noticeboard</h1>
          <p className="text-sm text-muted-foreground font-body">{notices.length} notices</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active hover:opacity-90">
          <Plus className="w-4 h-4" /> New Notice
        </button>
      </div>

      <div className="space-y-3">
        {notices.map(n => (
          <div key={n.id} className="bg-card rounded-2xl shadow-card border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground font-body text-sm">{n.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${audienceColors[n.audience]}`}>{n.audience}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground font-body mt-2">
                    {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button onClick={() => deleteNotice(n.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-active animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">New Notice</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Title*</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Message*</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={4}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Audience</label>
                <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value as any }))}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="all">All</option>
                  <option value="parents">Parents Only</option>
                  <option value="admin">Admin Only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold font-body text-muted-foreground">Cancel</button>
              <button onClick={addNotice} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
