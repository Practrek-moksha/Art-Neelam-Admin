import { useState, useEffect } from "react";
import { Phone, MessageCircle, Plus, ChevronRight, Sparkles, Loader2, UserPlus, Filter, Globe, PenLine, ThumbsDown, Trash2, Link2, QrCode, X, Copy, CheckCircle, XCircle, Edit3, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { openWhatsApp, templates } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BATCHES } from "@/data/dummy";

type LeadStatus = "new" | "contacted" | "converted" | "not-interested";

type Lead = {
  id: string; name: string; phone: string | null; email: string | null;
  course: string | null; status: string; source: string | null;
  follow_up_date: string | null; created_at: string; notes: string | null;
};

type Registration = {
  id: string; name: string; whatsapp: string; email: string | null;
  course: string; batch: string; dob: string | null; school_name: string | null;
  address: string | null; emergency_contact: string | null;
  father_name: string | null; father_contact: string | null;
  mother_name: string | null; mother_contact: string | null;
  guardian_name: string | null; payment_plan: string | null;
  terms_accepted: boolean | null; notes: string | null;
  status: string; lead_id: string | null; created_at: string;
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

const COURSE_FEES: Record<string, { fee: number; sessions: number }> = {
  Basic: { fee: 9000, sessions: 36 },
  Advanced: { fee: 15000, sessions: 36 },
  Professional: { fee: 30000, sessions: 36 },
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<LeadScore[]>([]);
  const [scoring, setScoring] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEnquiryLink, setShowEnquiryLink] = useState(false);
  const [view, setView] = useState<"kanban" | "list" | "registrations">("registrations");
  const [sourceFilter, setSourceFilter] = useState<"all" | "auto" | "manual">("all");
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", course: "Basic", source: "Website", notes: "", follow_up_date: "" });
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const navigate = useNavigate();

  const enquiryUrl = typeof window !== "undefined" ? `${window.location.origin}/enquiry` : "";

  const fetchLeads = async () => {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load leads"); console.error(error); }
    else setLeads(data || []);
  };

  const fetchRegistrations = async () => {
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load registrations"); console.error(error); }
    else setRegistrations(data || []);
  };

  useEffect(() => {
    Promise.all([fetchLeads(), fetchRegistrations()]).then(() => setLoading(false));
  }, []);

  const pendingRegistrations = registrations.filter(r => r.status === "pending");

  const autoSources = ["Website", "Google"];
  const filteredBySource = sourceFilter === "all" ? leads
    : sourceFilter === "auto" ? leads.filter(l => autoSources.includes(l.source || ""))
    : leads.filter(l => !autoSources.includes(l.source || ""));

  const moveCard = async (leadId: string, toStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: toStatus } : l));
    const { error } = await supabase.from("leads").update({ status: toStatus }).eq("id", leadId);
    if (error) { toast.error("Failed to update status"); fetchLeads(); }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) toast.error("Failed to delete");
    else { toast.success("Lead deleted"); setLeads(prev => prev.filter(l => l.id !== leadId)); }
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
      state: { prefill: { name: lead.name, whatsapp: lead.phone || "", email: lead.email || "", course: lead.course || "Basic", notes: lead.notes || "", source: lead.source || "", leadId: lead.id } },
    });
  };

  // Approve registration: create student from registration data
  const approveRegistration = async (reg: Registration) => {
    const config = COURSE_FEES[reg.course] || COURSE_FEES.Basic;
    const validityStart = new Date().toISOString().slice(0, 10);
    const weeks = Math.ceil(config.sessions / 4);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeks * 7);
    const validityEnd = endDate.toISOString().slice(0, 10);

    // Navigate to students page with pre-filled data from registration
    navigate("/students", {
      state: {
        prefill: {
          name: reg.name,
          whatsapp: reg.whatsapp,
          email: reg.email || "",
          course: reg.course,
          batch: reg.batch,
          dob: reg.dob || "",
          school_name: reg.school_name || "",
          address: reg.address || "",
          emergency_contact: reg.emergency_contact || "",
          father_name: reg.father_name || "",
          father_contact: reg.father_contact || "",
          mother_name: reg.mother_name || "",
          mother_contact: reg.mother_contact || "",
          guardian_name: reg.guardian_name || "",
          payment_plan: reg.payment_plan || "Full Payment",
          registrationId: reg.id,
          leadId: reg.lead_id || "",
        },
      },
    });
  };

  const rejectRegistration = async (regId: string) => {
    if (!confirm("Reject this registration?")) return;
    const { error } = await supabase.from("registrations").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", regId);
    if (error) toast.error("Failed to reject");
    else { toast.success("Registration rejected"); fetchRegistrations(); }
  };

  const saveEditedRegistration = async () => {
    if (!editReg) return;
    const { error } = await supabase.from("registrations").update({
      name: editReg.name, whatsapp: editReg.whatsapp, email: editReg.email,
      course: editReg.course, batch: editReg.batch, dob: editReg.dob,
      school_name: editReg.school_name, address: editReg.address,
      emergency_contact: editReg.emergency_contact,
      father_name: editReg.father_name, father_contact: editReg.father_contact,
      mother_name: editReg.mother_name, mother_contact: editReg.mother_contact,
      guardian_name: editReg.guardian_name, payment_plan: editReg.payment_plan,
      notes: editReg.notes,
    }).eq("id", editReg.id);
    if (error) toast.error("Failed to save");
    else { toast.success("Registration updated"); setEditReg(null); fetchRegistrations(); }
  };

  const runAIScoring = async () => {
    setScoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setScores(result.scores || []);
      toast.success(`Scored ${result.scores?.length || 0} leads with AI`);
    } catch (e: any) { toast.error(e.message || "AI scoring failed"); }
    finally { setScoring(false); }
  };

  const getScore = (id: string) => scores.find(s => s.id === id);
  const isConverted = (lead: Lead) => lead.status === "converted";

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads CRM</h1>
          <p className="text-sm text-muted-foreground font-body">{filteredBySource.length} leads • {pendingRegistrations.length} pending registrations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowEnquiryLink(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-warm text-warm-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all">
            <Link2 className="w-4 h-4" /> Enquiry Form
          </button>
          <button onClick={runAIScoring} disabled={scoring}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Score
          </button>
          <div className="flex bg-muted rounded-lg p-1">
            {(["registrations", "kanban", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn("px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all", view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {v === "registrations" ? "📝 Registrations" : v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-primary-foreground rounded-xl text-xs font-semibold shadow-active transition-all hover:opacity-90">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Source Filter (only for kanban/list) */}
      {view !== "registrations" && (
        <div className="flex gap-2">
          {([
            { key: "all", label: "All Leads", icon: Filter },
            { key: "auto", label: "Auto (Site Enquiry)", icon: Globe },
            { key: "manual", label: "Manual", icon: PenLine },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setSourceFilter(f.key)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all border",
                sourceFilter === f.key ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50")}>
              <f.icon className="w-3 h-3" /> {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ===== REGISTRATIONS VIEW ===== */}
      {view === "registrations" && (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">No registrations yet. Share the registration form link to start receiving applications.</div>
          ) : (
            <>
              {/* Status filter tabs */}
              <div className="flex gap-2">
                {[
                  { key: "all", label: `All (${registrations.length})` },
                  { key: "pending", label: `⏳ Pending (${registrations.filter(r => r.status === "pending").length})` },
                  { key: "approved", label: `✅ Approved (${registrations.filter(r => r.status === "approved").length})` },
                  { key: "rejected", label: `❌ Rejected (${registrations.filter(r => r.status === "rejected").length})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setSourceFilter(f.key as any)}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all border",
                      sourceFilter === f.key ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground")}>
                    {f.label}
                  </button>
                ))}
              </div>

              {(sourceFilter === "all" ? registrations : registrations.filter(r => r.status === sourceFilter))
                .map(reg => (
                <div key={reg.id} className="bg-card rounded-2xl shadow-card border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center font-display font-bold text-primary text-sm flex-shrink-0">
                        {reg.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground font-body">{reg.name}</p>
                        <p className="text-xs text-muted-foreground font-body">
                          {reg.whatsapp} • {reg.course} • {reg.batch}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">
                          {new Date(reg.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize",
                      reg.status === "pending" ? "bg-warm text-warm-foreground" :
                      reg.status === "approved" ? "bg-accent text-accent-foreground" :
                      "bg-destructive/10 text-destructive"
                    )}>{reg.status}</span>
                  </div>

                  {/* Details */}
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-body">
                    {reg.father_name && <p><span className="text-muted-foreground">Father:</span> <span className="text-foreground">{reg.father_name} {reg.father_contact && `(${reg.father_contact})`}</span></p>}
                    {reg.mother_name && <p><span className="text-muted-foreground">Mother:</span> <span className="text-foreground">{reg.mother_name} {reg.mother_contact && `(${reg.mother_contact})`}</span></p>}
                    {reg.dob && <p><span className="text-muted-foreground">DOB:</span> <span className="text-foreground">{new Date(reg.dob).toLocaleDateString("en-IN")}</span></p>}
                    {reg.school_name && <p><span className="text-muted-foreground">School:</span> <span className="text-foreground">{reg.school_name}</span></p>}
                    {reg.email && <p><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{reg.email}</span></p>}
                    {reg.payment_plan && <p><span className="text-muted-foreground">Plan:</span> <span className="text-foreground">{reg.payment_plan}</span></p>}
                  </div>
                  {reg.notes && <p className="text-[10px] text-muted-foreground font-body mt-2 line-clamp-2">{reg.notes}</p>}

                  {/* Actions */}
                  {reg.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditReg(reg)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-secondary rounded-xl text-secondary-foreground text-xs font-semibold hover:opacity-80">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => approveRegistration(reg)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-accent rounded-xl text-accent-foreground text-xs font-semibold hover:opacity-80">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve & Add Student
                      </button>
                      <button onClick={() => rejectRegistration(reg.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-destructive/10 rounded-xl text-destructive text-xs font-semibold hover:opacity-80">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openWhatsApp(reg.whatsapp, `Hi ${reg.name}! We received your registration for ${reg.course} course at Art Neelam Academy. We'll review and confirm soon.`)}
                        className="flex items-center justify-center px-3 py-2 bg-accent rounded-xl text-accent-foreground hover:opacity-80">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

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

      {/* Edit Registration Modal */}
      {editReg && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setEditReg(null)}>
          <div className="bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-lg p-6 shadow-active animate-fade-in max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Edit Registration</h2>
              <button onClick={() => setEditReg(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Student Name*", key: "name", type: "text" },
                { label: "WhatsApp*", key: "whatsapp", type: "tel" },
                { label: "Email", key: "email", type: "email" },
                { label: "Date of Birth", key: "dob", type: "date" },
                { label: "School Name", key: "school_name", type: "text" },
                { label: "Address", key: "address", type: "text" },
                { label: "Emergency Contact", key: "emergency_contact", type: "tel" },
                { label: "Father's Name", key: "father_name", type: "text" },
                { label: "Father's Contact", key: "father_contact", type: "tel" },
                { label: "Mother's Name", key: "mother_name", type: "text" },
                { label: "Mother's Contact", key: "mother_contact", type: "tel" },
                { label: "Guardian Name", key: "guardian_name", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-muted-foreground font-body">{f.label}</label>
                  <input type={f.type} value={(editReg as any)[f.key] || ""}
                    onChange={e => setEditReg(prev => prev ? { ...prev, [f.key]: e.target.value || null } : null)}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Course</label>
                  <select value={editReg.course} onChange={e => setEditReg(p => p ? { ...p, course: e.target.value } : null)}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Basic", "Advanced", "Professional"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground font-body">Batch</label>
                  <select value={editReg.batch} onChange={e => setEditReg(p => p ? { ...p, batch: e.target.value } : null)}
                    className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {BATCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Payment Plan</label>
                <select value={editReg.payment_plan || "Full Payment"} onChange={e => setEditReg(p => p ? { ...p, payment_plan: e.target.value } : null)}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Full Payment</option>
                  <option>50-30-20 Installment</option>
                  <option>50-50 Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Notes</label>
                <textarea value={editReg.notes || ""} onChange={e => setEditReg(p => p ? { ...p, notes: e.target.value || null } : null)} rows={2}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditReg(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground font-body hover:bg-muted">Cancel</button>
              <button onClick={saveEditedRegistration} className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 flex-1">
          {columns.map(col => {
            const colLeads = filteredBySource.filter(l => l.status === col.key);
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
                    const converted = isConverted(lead);
                    return (
                      <div key={lead.id} draggable onDragStart={() => setDragging(lead.id)} onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        className={cn("bg-card rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all", dragging === lead.id && "opacity-50 rotate-2")}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground text-sm flex-shrink-0">
                            {lead.name[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground font-body truncate">{lead.name}</p>
                            <p className="text-[10px] text-muted-foreground font-body">
                              {lead.course} • {lead.source}
                              {autoSources.includes(lead.source || "") && <span className="ml-1 text-primary">🌐</span>}
                            </p>
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
                        {!converted && (
                          <>
                            <div className="flex gap-1.5">
                              <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-accent rounded-lg text-accent-foreground text-[10px] font-semibold hover:opacity-80">
                                <Phone className="w-3 h-3" /> Call
                              </a>
                              <button onClick={() => lead.phone && openWhatsApp(lead.phone, templates.followUp(lead.name, lead.course || ""))} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-accent rounded-lg text-accent-foreground text-[10px] font-semibold hover:opacity-80">
                                <MessageCircle className="w-3 h-3" /> WA
                              </button>
                            </div>
                            <button onClick={() => convertToStudent(lead)}
                              className="w-full mt-1.5 flex items-center justify-center gap-1 py-1.5 bg-primary-soft text-primary rounded-lg text-[10px] font-semibold hover:opacity-80">
                              <UserPlus className="w-3 h-3" /> Convert to Student
                            </button>
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {columns.filter(c => c.key !== col.key && c.key !== "converted").map(c => (
                                <button key={c.key} onClick={() => moveCard(lead.id, c.key)}
                                  className={cn("flex-1 text-[9px] py-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 font-body min-w-0",
                                    c.key === "not-interested" && "text-red-600")}>
                                  {c.key === "not-interested" ? "✕ Not Int." : `→ ${c.label}`}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        {converted && (
                          <p className="text-[10px] text-accent-foreground font-semibold bg-accent rounded-lg px-2 py-1 text-center mt-1">✓ Converted to Student</p>
                        )}
                        {!converted && (
                          <button onClick={() => deleteLead(lead.id)}
                            className="w-full mt-1 flex items-center justify-center gap-1 py-1 text-[9px] text-destructive hover:bg-destructive/10 rounded-lg font-body">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
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
            {filteredBySource.map(lead => {
              const sc = getScore(lead.id);
              const converted = isConverted(lead);
              return (
                <div key={lead.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground flex-shrink-0">
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground font-body">{lead.name}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {lead.phone} • {lead.course} • {lead.source}
                      {autoSources.includes(lead.source || "") && <span className="ml-1">🌐 Auto</span>}
                    </p>
                    {sc && <p className="text-[10px] text-primary font-body">Score: {sc.score} — {sc.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                      lead.status === "converted" ? "bg-accent text-accent-foreground" :
                      lead.status === "new" ? "bg-secondary text-secondary-foreground" :
                      lead.status === "not-interested" ? "bg-muted text-muted-foreground" :
                      "bg-warm text-warm-foreground"
                    }`}>{lead.status}</span>
                    {!converted && lead.status !== "not-interested" && (
                      <button onClick={() => moveCard(lead.id, "not-interested")}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Mark Not Interested">
                        <ThumbsDown className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                    {!converted && (
                      <button onClick={() => convertToStudent(lead)}
                        className="p-1.5 rounded-lg hover:bg-primary-soft transition-colors" title="Convert to Student">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </button>
                    )}
                    {!converted && (
                      <button onClick={() => lead.phone && openWhatsApp(lead.phone, templates.followUp(lead.name, lead.course || ""))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                        <MessageCircle className="w-4 h-4 text-accent-vivid" />
                      </button>
                    )}
                    {!converted && (
                      <button onClick={() => deleteLead(lead.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enquiry Form Link Modal */}
      {showEnquiryLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowEnquiryLink(false)}>
          <div className="bg-card rounded-2xl p-6 shadow-active animate-fade-in max-w-sm mx-4 w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground text-lg">Public Enquiry Form</h3>
              <button onClick={() => setShowEnquiryLink(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <p className="text-xs text-muted-foreground font-body mb-4">
              Share this link on your website, social media, or print the QR code. Enquiries will automatically appear as new leads here.
            </p>

            <div className="bg-muted rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 mb-4">
              <p className="text-xs text-foreground font-body break-all flex-1">{enquiryUrl}</p>
              <button onClick={() => { navigator.clipboard.writeText(enquiryUrl); toast.success("Link copied!"); }}
                className="p-1.5 rounded-lg bg-primary-soft text-primary hover:opacity-80 flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-muted rounded-xl p-4 text-center mb-4">
              <p className="text-xs font-semibold text-muted-foreground font-body mb-3">QR Code — Print & Display</p>
              <div className="inline-block bg-white p-3 rounded-xl">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(enquiryUrl)}`} alt="QR Code" className="w-[180px] h-[180px]" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground font-body">Embed on your website:</p>
              <div className="bg-muted rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <code className="text-[10px] text-foreground font-mono break-all flex-1">
                  {`<a href="${enquiryUrl}">Enquire Now</a>`}
                </code>
                <button onClick={() => { navigator.clipboard.writeText(`<a href="${enquiryUrl}" target="_blank" style="background:#e8697a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Enquire Now</a>`); toast.success("HTML copied!"); }}
                  className="p-1.5 rounded-lg bg-primary-soft text-primary hover:opacity-80 flex-shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <a href="/enquiry" target="_blank" rel="noopener"
              className="mt-4 w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" /> Preview Enquiry Form
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
