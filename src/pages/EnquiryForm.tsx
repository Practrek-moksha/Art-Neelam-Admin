import { useState, useEffect } from "react";
import { CheckCircle, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logoImg from "@/assets/logo.png";

const COURSES = [
  { key: "Basic", label: "Basic Level", ages: "Ages 4–7", fee: "₹9,000" },
  { key: "Advanced", label: "Advance Level", ages: "Ages 8–12", fee: "₹15,000" },
  { key: "Professional", label: "Professional Level", ages: "Ages 13+", fee: "₹30,000" },
];

export default function EnquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("enquiry_form_draft");
      if (saved) {
        const { data, expiry } = JSON.parse(saved);
        if (expiry && Date.now() < expiry) return { ...{ name: "", phone: "", email: "", course: "Basic", source: "Website", notes: "" }, ...data };
        localStorage.removeItem("enquiry_form_draft");
      }
    } catch {}
    return { name: "", phone: "", email: "", course: "Basic", source: "Website", notes: "" };
  });

  // Auto-save form draft to localStorage (24h expiry)
  useEffect(() => {
    const hasData = form.name || form.phone || form.email;
    if (hasData) {
      localStorage.setItem("enquiry_form_draft", JSON.stringify({ data: form, expiry: Date.now() + 24 * 60 * 60 * 1000 }));
    }
  }, [form]);

  const enquiryUrl = typeof window !== "undefined" ? `${window.location.origin}/enquiry` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    setError("");

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/receive-lead`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "artneelam-lead-key-2024",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.replace(/[\s\-()]/g, ""),
            email: form.email || null,
            course: form.course,
            source: form.source,
            notes: form.notes || null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      localStorage.removeItem("enquiry_form_draft");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-accent-vivid" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Enquiry Submitted!</h2>
          <p className="text-muted-foreground font-body mt-2">Thank you for your interest in Art Neelam Academy. We'll contact you shortly on WhatsApp.</p>
          <a href="/register" className="inline-block mt-4 text-sm text-primary font-semibold hover:underline">
            Ready to enroll? Register here →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-primary px-5 py-6 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Art Neelam" className="w-10 h-10 rounded-xl object-contain bg-primary-foreground/20 p-1" />
            <div>
              <h1 className="font-display font-bold text-primary-foreground text-lg">Art Neelam Academy</h1>
              <p className="text-xs text-primary-foreground/80 font-body">Drawing & Painting Classes</p>
            </div>
          </div>
          <button onClick={() => setShowQR(true)} className="p-2 rounded-xl bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors" title="QR Code">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 max-w-lg mx-auto pb-10">
        <div className="text-center py-2">
          <h2 className="font-display text-xl font-bold text-foreground">Enquire Now</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">Fill in your details and we'll get in touch</p>
        </div>

        {/* Course Selection Cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground font-body">Select Course</label>
          <div className="grid grid-cols-1 gap-2">
            {COURSES.map(c => (
              <button key={c.key} type="button" onClick={() => setForm(p => ({ ...p, course: c.key }))}
                className={`text-left p-3 rounded-xl border transition-all ${form.course === c.key ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/50"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold font-body text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground font-body">{c.ages}</p>
                  </div>
                  <p className="font-display font-bold text-primary text-lg">{c.fee}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Student / Parent Name" required
              className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Phone Number *</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 9920546217" required
              className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Email (optional)</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="Email address"
              className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Message (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Any questions or special requests?" rows={2}
              className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>

        {error && <p className="text-xs text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={!form.name || !form.phone || loading}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-bold font-body text-base shadow-active hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? "Submitting..." : "Submit Enquiry"}
        </button>

        <p className="text-center text-xs text-muted-foreground font-body">
          Already enrolled? <a href="/register" className="text-primary font-semibold hover:underline">Register here</a>
        </p>
      </form>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-card rounded-2xl p-6 shadow-active animate-fade-in text-center max-w-xs mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground text-lg">Share Enquiry Form</h3>
              <button onClick={() => setShowQR(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG value={enquiryUrl} size={200} level="H" />
            </div>
            <p className="text-xs text-muted-foreground font-body mb-2">Scan to open enquiry form</p>
            <div className="bg-muted rounded-xl px-3 py-2">
              <p className="text-[10px] text-foreground font-body break-all">{enquiryUrl}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(enquiryUrl); }}
              className="mt-3 w-full py-2 rounded-xl bg-primary-soft text-primary text-xs font-semibold hover:opacity-80">
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
