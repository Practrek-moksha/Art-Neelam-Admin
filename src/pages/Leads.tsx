import { useState, useEffect } from "react";
import { Phone, MessageCircle, Plus, ChevronRight, Sparkles, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type LeadStatus = "new" | "contacted" | "converted" | "not-interested";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  course: string | null;
  status: string;
  source: string | null;
  follow_up_date: string | null;
  created_at: string;
  notes: string | null;
};

type LeadScore = { id: string; score: number; reason: string };

type Column = { key: LeadStatus; label: string; color: string; textColor: string };

const columns: Column[] = [
  { key: "new", label: "New", color: "bg-kanban-new", textColor: "text-blue-700" },
  { key: "contacted", label: "Contacted", color: "bg-kanban-follow", textColor: "text-amber-700" },
  { key: "converted", label: "Converted", color: "bg-kanban-converted", textColor: "text-green-700" },
  { key: "not-interested", label: "Not Interested", color: "bg-kanban-lost", textColor: "text-red-700" },
];

const statusDot: Record<LeadStatus, string> = {
  new: "bg-blue-400", contacted: "bg-amber-400", converted: "bg-green-400", "not-interested": "bg-red-400",
};

const SOURCES = ["Website", "Instagram", "Facebook", "Google", "Referral", "Walk-in", "Other"];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<LeadScore[]>([]);
  const [scoring, setScoring] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", course: "Basic", source: "Website", notes: "", follow_up_date: "" });
  const navigate = useNavigate();

  const fetchLeads = async () => {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load leads"); console.error(error); }
    else setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const moveCard = async (leadId: string, toStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: toStatus } : l));
    const { error } = await supabase.from("leads").update({ status: toStatus }).eq("id", leadId);
    if (error) { toast.error("Failed to update status"); fetchLeads(); }
  };

  const addLead = async () => {
    if (!newLead.name || !newLead.phone) return;
    const { error } = await supabase.from("leads").insert({
      name: newLead.name, phone: newLead.phone || null, email: newLead.email || null,
      course: newLead.course, source: newLead.source, notes: newLead.notes || null,
      follow_up_date: newLead.follow_up_date || null, status: "new",
    });
    if (error) { toast.error("Failed to add lead: " + error.message); }
    else {
      toast.success("Lead added!");
      setShowForm(false);
      setNewLead({ name: "", phone: "", email: "", course: "Basic", source: "Website", notes: "", follow_up_date: "" });
      fetchLeads();
    }
  };

  const convertToStudent = (lead: Lead) => {
    navigate("/students", {
      state: {
        prefill: {
          name: lead.name,
          whatsapp: lead.phone || "",
          email: lead.email || "",
          course: lead.course || "Basic",
          notes: lead.notes || "",
          source: lead.source || "",
        },
      },
    });
  };

  const runAIScoring = async () => {
    setScoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setScores(result.scores || []);
      toast.success(`Scored ${result.scores?.length || 0} leads with AI`);
    } catch (e: any) {
      toast.error(e.message || "AI scoring failed");
    } finally { setScoring(false); }
  };

  const getScore = (id: string) => scores.find(s => s.id === id);

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads CRM</h1>
          <p className="text-sm text-muted-foreground font-body">{leads.length} total leads</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runAIScoring} disabled={scoring}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Score
          </button>
          <div className="flex bg-muted rounded-lg p-1">
            {(["kanban", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn("px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all", view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active transition-all hover:opacity-90">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 shadow-active animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Add New Lead</h2>
            <div className="space-y-3">
              {[
                { label: "Full Name*", key: "name", type: "text" },
                { label: "Phone*", key: "phone", type: "tel" },
                { label: "Email", key: "email", type: "email" },
                { label: "Follow-up Date", key: "follow_up_date", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground font-body">{f.label}</label>
                  <input type={f.type} value={(newLead as any)[f.key]}
                    onChange={e => setNewLead(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Course</label>
                  <select value={newLead.course} onChange={e => setNewLead(p => ({ ...p, course: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Basic", "Advanced", "Professional"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Source</label>
                  <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Notes</label>
                <textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground font-body hover:bg-muted transition-colors">Cancel</button>
              <button onClick={addLead} className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-opacity">Add Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 flex-1">
          {columns.map(col => {
            const colLeads = leads.filter(l => l.status === col.key);
            return (
              <div key={col.key}
                className={cn("flex-shrink-0 w-64 rounded-2xl p-3 transition-all", col.color, dragOver === col.key && "ring-2 ring-primary")}
                onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
                onDrop={() => { if (dragging) moveCard(dragging, col.key); setDragging(null); setDragOver(null); }}
                onDragLeave={() => setDragOver(null)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusDot[col.key]}`} />
                    <span className={`text-xs font-bold font-body ${col.textColor}`}>{col.label}</span>
                  </div>
                  <span className="text-xs bg-card/60 rounded-full px-2 py-0.5 font-semibold font-body text-muted-foreground">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map(lead => {
                    const sc = getScore(lead.id);
                    return (
                      <div key={lead.id} draggable onDragStart={() => setDragging(lead.id)} onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        className={cn("bg-card rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all", dragging === lead.id && "opacity-50 rotate-2")}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground text-sm flex-shrink-0">
                            {lead.name[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground font-body truncate">{lead.name}</p>
                            <p className="text-[10px] text-muted-foreground font-body">{lead.course} • {lead.source}</p>
                          </div>
                          {sc && (
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              sc.score >= 70 ? "bg-accent text-accent-foreground" : sc.score >= 40 ? "bg-warm text-warm-foreground" : "bg-muted text-muted-foreground")}>
                              {sc.score}
                            </span>
                          )}
                        </div>
                        {sc && <p className="text-[10px] text-primary font-body mb-1">🤖 {sc.reason}</p>}
                        {lead.notes && <p className="text-[10px] text-muted-foreground font-body mb-2 line-clamp-2">{lead.notes}</p>}
                        {lead.follow_up_date && (
                          <p className="text-[10px] text-primary font-semibold mb-2 font-body">📅 {new Date(lead.follow_up_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        )}
                        <div className="flex gap-1.5">
                          <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-accent rounded-lg text-accent-foreground text-[10px] font-semibold hover:opacity-80 transition-opacity">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <button onClick={() => lead.phone && openWhatsApp(lead.phone, templates.followUp(lead.name, lead.course || ""))} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-accent rounded-lg text-accent-foreground text-[10px] font-semibold hover:opacity-80 transition-opacity">
                            <MessageCircle className="w-3 h-3" /> WA
                          </button>
                        </div>
                        {/* Convert to Student button */}
                        <button onClick={() => convertToStudent(lead)}
                          className="w-full mt-1.5 flex items-center justify-center gap-1 py-1.5 bg-primary-soft text-primary rounded-lg text-[10px] font-semibold hover:opacity-80 transition-opacity">
                          <UserPlus className="w-3 h-3" /> Convert to Student
                        </button>
                        <div className="flex gap-1 mt-1.5">
                          {columns.filter(c => c.key !== col.key).slice(0, 2).map(c => (
                            <button key={c.key} onClick={() => moveCard(lead.id, c.key)}
                              className="flex-1 text-[9px] py-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-body">
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {colLeads.length === 0 && <div className="text-center py-6 text-xs text-muted-foreground font-body opacity-70">Drop here</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden flex-1">
          <div className="divide-y divide-border">
            {leads.map(lead => {
              const sc = getScore(lead.id);
              return (
                <div key={lead.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground flex-shrink-0">
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground font-body">{lead.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{lead.phone} • {lead.course} • {lead.source}</p>
                    {sc && <p className="text-[10px] text-primary font-body">Score: {sc.score} — {sc.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                      lead.status === "converted" ? "bg-accent text-accent-foreground" :
                      lead.status === "new" ? "bg-secondary text-secondary-foreground" :
                      lead.status === "not-interested" ? "bg-muted text-muted-foreground" :
                      "bg-warm text-warm-foreground"
                    }`}>{lead.status}</span>
                    <button onClick={() => convertToStudent(lead)}
                      className="p-1.5 rounded-lg hover:bg-primary-soft transition-colors" title="Convert to Student">
                      <UserPlus className="w-4 h-4 text-primary" />
                    </button>
                    <button onClick={() => lead.phone && openWhatsApp(lead.phone, templates.followUp(lead.name, lead.course || ""))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                      <MessageCircle className="w-4 h-4 text-accent-vivid" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
