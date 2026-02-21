import { useState, useEffect } from "react";
import { Plus, Bell, X, Trash2, Send } from "lucide-react";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NoticeRow = { id: string; title: string; body: string | null; date: string; audience: string };

export default function Notices() {
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [students, setStudents] = useState<{ whatsapp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });

  useEffect(() => {
    (async () => {
      const [nRes, sRes] = await Promise.all([
        supabase.from("notices").select("*").order("date", { ascending: false }),
        supabase.from("students").select("whatsapp"),
      ]);
      setNotices(nRes.data || []);
      setStudents(sRes.data || []);
      setLoading(false);
    })();
  }, []);

  const addNotice = async () => {
    if (!form.title || !form.body) return;
    const { error } = await supabase.from("notices").insert({ title: form.title, body: form.body, audience: form.audience });
    if (error) { toast.error("Failed to post notice"); return; }
    toast.success("Notice posted!");
    setShowForm(false);
    setForm({ title: "", body: "", audience: "all" });
    const { data } = await supabase.from("notices").select("*").order("date", { ascending: false });
    setNotices(data || []);
  };

  const deleteNotice = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    setNotices(prev => prev.filter(n => n.id !== id));
    toast.success("Notice deleted");
  };

  const audienceColors: Record<string, string> = {
    all: "bg-accent text-accent-foreground",
    parents: "bg-secondary text-secondary-foreground",
    admin: "bg-primary-soft text-primary",
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

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
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0"><Bell className="w-4 h-4 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground font-body text-sm">{n.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${audienceColors[n.audience] || ""}`}>{n.audience}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground font-body mt-2">
                    {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => students.forEach(s => openWhatsApp(s.whatsapp, templates.notice(n.title, n.body || "")))}
                  className="p-1.5 rounded-lg hover:bg-primary-soft text-muted-foreground hover:text-primary transition-colors" title="Broadcast via WhatsApp">
                  <Send className="w-4 h-4" />
                </button>
                <button onClick={() => deleteNotice(n.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No notices yet.</p>}
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
                <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
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
