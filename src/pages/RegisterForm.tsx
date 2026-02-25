import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Palette, CheckCircle } from "lucide-react";

const BATCHES = [
  "Professional (10:00 AM - 11:30 AM)",
  "Advance + Basic (11:30 AM - 1:00 PM)",
  "Basic 1 (1:00 PM - 2:30 PM)",
  "Basic 2 (2:30 PM - 4:00 PM)",
];

function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

export default function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState({
    name: "", dob: "", schoolName: "", address: "", emergencyContact: "",
    fatherName: "", fatherContact: "", motherName: "", motherContact: "",
    guardianName: "", whatsapp: "", email: "", course: "Basic",
    batch: "Professional (10:00 AM - 11:30 AM)", agreedTerms: false,
  });

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError("WhatsApp number is required");
      return false;
    }
    if (!isValidIndianPhone(phone)) {
      setPhoneError("Enter a valid 10-digit Indian number (starting with 6-9)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.agreedTerms) return;
    if (!validatePhone(form.whatsapp)) return;

    setLoading(true);
    setError("");

    try {
      const notes = [
        form.fatherName && `Father: ${form.fatherName} (${form.fatherContact})`,
        form.motherName && `Mother: ${form.motherName} (${form.motherContact})`,
        form.guardianName && `Guardian: ${form.guardianName}`,
        form.schoolName && `School: ${form.schoolName}`,
        form.address && `Address: ${form.address}`,
        `Batch: ${form.batch}`,
        form.dob && `DOB: ${form.dob}`,
      ].filter(Boolean).join(" | ");

      const { data, error: fnError } = await supabase.functions.invoke("submit-registration", {
        body: {
          name: form.name.trim(),
          phone: form.whatsapp,
          email: form.email || null,
          course: form.course,
          notes,
        },
      });

      if (fnError) throw new Error(fnError.message || "Submission failed");
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
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
          <h2 className="font-display text-2xl font-bold text-foreground">Registration Submitted!</h2>
          <p className="text-muted-foreground font-body mt-2">Thank you for registering with Art Neelam Academy. We'll contact you on WhatsApp to confirm your enrollment.</p>
          <div className="mt-6 p-4 bg-card rounded-2xl border border-border shadow-card text-left">
            <p className="text-xs font-semibold text-muted-foreground font-body">Student Name</p>
            <p className="text-base font-bold font-body text-foreground">{form.name}</p>
            <p className="text-xs font-semibold text-muted-foreground font-body mt-2">Course</p>
            <p className="text-sm font-body text-foreground">{form.course} • {form.batch}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-primary px-5 py-6 pt-safe">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-primary-foreground text-lg">Art Neelam Academy</h1>
            <p className="text-xs text-primary-foreground/80 font-body">Student Registration Form</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6 max-w-lg mx-auto pb-10">
        <FormSection title="Personal Information">
          <Field label="Student Name*" type="text" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Full name" required />
          <Field label="Date of Birth*" type="date" value={form.dob} onChange={v => setForm(p => ({ ...p, dob: v }))} required />
          <Field label="School Name" type="text" value={form.schoolName} onChange={v => setForm(p => ({ ...p, schoolName: v }))} placeholder="Current school" />
          <Field label="Address" type="text" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="Home address" textarea />
          <Field label="Emergency Contact" type="tel" value={form.emergencyContact} onChange={v => setForm(p => ({ ...p, emergencyContact: v }))} placeholder="Emergency phone" />
        </FormSection>

        <FormSection title="Parent / Guardian Details">
          <Field label="Father's Name" type="text" value={form.fatherName} onChange={v => setForm(p => ({ ...p, fatherName: v }))} placeholder="Father's full name" />
          <Field label="Father's Contact" type="tel" value={form.fatherContact} onChange={v => setForm(p => ({ ...p, fatherContact: v }))} placeholder="Father's phone" />
          <Field label="Mother's Name" type="text" value={form.motherName} onChange={v => setForm(p => ({ ...p, motherName: v }))} placeholder="Mother's full name" />
          <Field label="Mother's Contact" type="tel" value={form.motherContact} onChange={v => setForm(p => ({ ...p, motherContact: v }))} placeholder="Mother's phone" />
          <Field label="Guardian Name (Optional)" type="text" value={form.guardianName} onChange={v => setForm(p => ({ ...p, guardianName: v }))} placeholder="If applicable" />
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">WhatsApp Number*</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={e => {
                setForm(p => ({ ...p, whatsapp: e.target.value }));
                if (phoneError) validatePhone(e.target.value);
              }}
              onBlur={() => form.whatsapp && validatePhone(form.whatsapp)}
              placeholder="e.g. 9920546217"
              required
              className={`w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 ${phoneError ? "border-destructive" : "border-border"}`}
            />
            {phoneError && <p className="text-xs text-destructive font-body mt-1">{phoneError}</p>}
          </div>
          <Field label="Email Address" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="Email (optional)" />
        </FormSection>

        <FormSection title="Course Details">
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Course*</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {["Basic", "Advanced", "Professional"].map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, course: c }))}
                  className={`py-2.5 rounded-xl text-xs font-bold font-body transition-all border ${form.course === c ? "gradient-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Preferred Batch*</label>
            <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}
              className="w-full mt-1 px-3 py-2.5 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              {BATCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </FormSection>

        <div className="bg-muted rounded-2xl p-4">
          <h3 className="font-display font-bold text-foreground text-sm mb-2">Terms & Conditions</h3>
          <div className="text-[11px] text-muted-foreground font-body space-y-1 mb-3 max-h-24 overflow-y-auto">
            <p>• Fees once paid are non-refundable.</p>
            <p>• Students are expected to maintain 75% attendance.</p>
            <p>• Studio materials will be provided for Basic course only.</p>
            <p>• Students must carry their ID card to every class.</p>
            <p>• The studio reserves the right to change batch timings with prior notice.</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.agreedTerms} onChange={e => setForm(p => ({ ...p, agreedTerms: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-border accent-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-foreground font-body">I agree to the Terms & Conditions and give consent to enroll my child / myself.</span>
          </label>
        </div>

        {error && <p className="text-xs text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={!form.agreedTerms || !form.name || !form.whatsapp || loading}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-bold font-body text-base shadow-active hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="px-4 py-3 bg-primary-soft border-b border-border">
        <h3 className="font-display font-bold text-primary text-sm">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, required, textarea }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground font-body">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} rows={2}
          className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      )}
    </div>
  );
}
