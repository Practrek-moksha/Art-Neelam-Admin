import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, QrCode, FileText, X, Camera } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logoImg from "@/assets/logo.png";
import { BATCHES } from "@/data/dummy";

const COURSE_FEES: Record<string, { fee: number; sessions: number; ages: string }> = {
  Basic: { fee: 9000, sessions: 36, ages: "Ages 4–7" },
  Advanced: { fee: 15000, sessions: 36, ages: "Ages 8–12" },
  Professional: { fee: 30000, sessions: 36, ages: "Ages 13+" },
};

function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

export default function RegisterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("register_form_draft");
      if (saved) {
        const { data, expiry } = JSON.parse(saved);
        if (expiry && Date.now() < expiry) return { ...{ name: "", dob: "", schoolName: "", address: "", emergencyContact: "", fatherName: "", fatherContact: "", motherName: "", motherContact: "", guardianName: "", whatsapp: "", email: "", course: "Basic", batch: BATCHES[2], agreedTerms: false, paymentPlan: "Full Payment" }, ...data };
        localStorage.removeItem("register_form_draft");
      }
    } catch {}
    return {
      name: "", dob: "", schoolName: "", address: "", emergencyContact: "",
      fatherName: "", fatherContact: "", motherName: "", motherContact: "",
      guardianName: "", whatsapp: "", email: "", course: "Basic",
      batch: BATCHES[2], agreedTerms: false, paymentPlan: "Full Payment",
    };
  });

  useEffect(() => {
    const hasData = form.name || form.whatsapp || form.email;
    if (hasData) {
      localStorage.setItem("register_form_draft", JSON.stringify({ data: form, expiry: Date.now() + 24 * 60 * 60 * 1000 }));
    }
  }, [form]);

  const registrationUrl = typeof window !== "undefined" ? `${window.location.origin}/register` : "";
  const selectedCourse = COURSE_FEES[form.course];

  const validatePhone = (phone: string) => {
    if (!phone) { setPhoneError("WhatsApp number is required"); return false; }
    if (!isValidIndianPhone(phone)) { setPhoneError("Enter a valid 10-digit Indian number (starting with 6-9)"); return false; }
    setPhoneError("");
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { setError("Photo must be less than 1 MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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
          batch: form.batch,
          notes,
          dob: form.dob || null,
          school_name: form.schoolName || null,
          address: form.address || null,
          emergency_contact: form.emergencyContact || null,
          father_name: form.fatherName || null,
          father_contact: form.fatherContact || null,
          mother_name: form.motherName || null,
          mother_contact: form.motherContact || null,
          guardian_name: form.guardianName || null,
          terms_accepted: form.agreedTerms,
          payment_plan: form.paymentPlan,
        },
      });

      if (fnError) throw new Error(fnError.message || "Submission failed");
      if (data?.error) throw new Error(data.error);

      localStorage.removeItem("register_form_draft");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-accent-vivid" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Registration Submitted!</h2>
          <p className="text-muted-foreground font-body mt-2">Thank you for registering with Art Neelam Academy. Your application is under review. We'll contact you on WhatsApp once approved.</p>
          <div className="mt-6 p-4 bg-card rounded-2xl border border-border shadow-card text-left">
            <p className="text-xs font-semibold text-muted-foreground font-body">Student Name</p>
            <p className="text-base font-bold font-body text-foreground">{form.name}</p>
            <p className="text-xs font-semibold text-muted-foreground font-body mt-2">Course</p>
            <p className="text-sm font-body text-foreground">{form.course} • {form.batch}</p>
            <p className="text-xs font-semibold text-muted-foreground font-body mt-2">Status</p>
            <p className="text-sm font-bold font-body text-primary">⏳ Pending Review</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-primary px-4 py-5 pt-safe">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Art Neelam" className="w-10 h-10 rounded-xl object-contain bg-primary-foreground/20 p-1" />
            <div>
              <h1 className="font-display font-bold text-primary-foreground text-lg">Art Neelam Academy</h1>
              <p className="text-xs text-primary-foreground/80 font-body">Student Registration Form</p>
            </div>
          </div>
          <button onClick={() => setShowQR(true)} className="p-2 rounded-xl bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors" title="Show QR Code">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-lg mx-auto pb-10">
        <FormSection title="Personal Information">
          <Field label="Student Name*" type="text" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Full name" required />
          <Field label="Date of Birth*" type="date" value={form.dob} onChange={v => setForm(p => ({ ...p, dob: v }))} required />
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Student Photo (max 1 MB)</label>
            <div className="flex items-center gap-3 mt-1">
              {photoPreview ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <span className="inline-block px-3 py-2 bg-muted rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:border-primary/50">
                  {photoPreview ? "Change Photo" : "Upload Photo"}
                </span>
              </label>
            </div>
          </div>
          <Field label="School Name" type="text" value={form.schoolName} onChange={v => setForm(p => ({ ...p, schoolName: v }))} placeholder="Current school" />
          <Field label="Address" type="text" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="Home address" textarea />
          <Field label="Emergency Contact" type="tel" value={form.emergencyContact} onChange={v => setForm(p => ({ ...p, emergencyContact: v }))} placeholder="Emergency phone" />
        </FormSection>

        <FormSection title="Parent / Guardian Details">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Father's Name" type="text" value={form.fatherName} onChange={v => setForm(p => ({ ...p, fatherName: v }))} placeholder="Father's name" />
            <Field label="Father's Contact" type="tel" value={form.fatherContact} onChange={v => setForm(p => ({ ...p, fatherContact: v }))} placeholder="Father's phone" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mother's Name" type="text" value={form.motherName} onChange={v => setForm(p => ({ ...p, motherName: v }))} placeholder="Mother's name" />
            <Field label="Mother's Contact" type="tel" value={form.motherContact} onChange={v => setForm(p => ({ ...p, motherContact: v }))} placeholder="Mother's phone" />
          </div>
          <Field label="Guardian Name (Optional)" type="text" value={form.guardianName} onChange={v => setForm(p => ({ ...p, guardianName: v }))} placeholder="If applicable" />
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">WhatsApp Number*</label>
            <input type="tel" value={form.whatsapp}
              onChange={e => { setForm(p => ({ ...p, whatsapp: e.target.value })); if (phoneError) validatePhone(e.target.value); }}
              onBlur={() => { if (form.whatsapp) validatePhone(form.whatsapp); }}
              placeholder="e.g. 9920546217" required
              className={`w-full mt-1 px-3 py-2 bg-muted rounded-xl border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 ${phoneError ? "border-destructive" : "border-border"}`}
            />
            {phoneError && <p className="text-xs text-destructive font-body mt-1">{phoneError}</p>}
          </div>
          <Field label="Email Address" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="Email (optional)" />
        </FormSection>

        <FormSection title="Course Details">
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Course*</label>
            <div className="space-y-2 mt-2">
              {Object.entries(COURSE_FEES).map(([key, c]) => (
                <button key={key} type="button" onClick={() => setForm(p => ({ ...p, course: key }))}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${form.course === key ? "gradient-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/50"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold font-body">{key}</span>
                      <span className={`text-xs font-body ml-2 ${form.course === key ? "text-primary-foreground/80" : "text-muted-foreground"}`}>({c.ages})</span>
                    </div>
                    <span className="font-display font-bold text-base">₹{c.fee.toLocaleString()}</span>
                  </div>
                  <p className={`text-[10px] font-body mt-0.5 ${form.course === key ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {c.sessions} sessions • Materials included
                  </p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Preferred Batch Timing*</label>
            <select value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              {BATCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Payment Plan*</label>
            <select value={form.paymentPlan} onChange={e => setForm(p => ({ ...p, paymentPlan: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-card border border-border rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="Full Payment">Full Payment</option>
              <option value="50-30-20 Installment">50-30-20 Installment</option>
              <option value="50-50 Custom">50-50 Custom</option>
            </select>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <p className="text-xs font-bold text-foreground font-body mb-2">💰 Fee Structure</p>
            <div className="space-y-1 text-[11px] font-body">
              {form.paymentPlan === "Full Payment" && (
                <div className="flex justify-between"><span className="text-muted-foreground">Full Amount</span><span className="font-semibold text-foreground">₹{selectedCourse.fee.toLocaleString()}</span></div>
              )}
              {form.paymentPlan === "50-30-20 Installment" && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">1st (50%)</span><span className="font-semibold text-foreground">₹{Math.round(selectedCourse.fee * 0.5).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">2nd (30%)</span><span className="font-semibold text-foreground">₹{Math.round(selectedCourse.fee * 0.3).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">3rd (20%)</span><span className="font-semibold text-foreground">₹{Math.round(selectedCourse.fee * 0.2).toLocaleString()}</span></div>
                </>
              )}
              {form.paymentPlan === "50-50 Custom" && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">1st (50%)</span><span className="font-semibold text-foreground">₹{Math.round(selectedCourse.fee * 0.5).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">2nd (50%)</span><span className="font-semibold text-foreground">₹{Math.round(selectedCourse.fee * 0.5).toLocaleString()}</span></div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-bold text-foreground">Total</span><span className="font-bold text-primary">₹{selectedCourse.fee.toLocaleString()}</span></div>
            </div>
          </div>
        </FormSection>

        <div className="bg-muted rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-foreground text-sm">Terms & Conditions</h3>
            <button type="button" onClick={() => setShowPDF(true)}
              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
              <FileText className="w-3.5 h-3.5" /> View Full PDF
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground font-body space-y-1 mb-3 max-h-24 overflow-y-auto">
            <p>• Fees once paid are non-refundable.</p>
            <p>• Students are expected to maintain 75% attendance.</p>
            <p>• Studio materials will be provided as per course.</p>
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
          className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold font-body text-base shadow-active hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? "Submitting..." : "Submit Registration"}
        </button>
      </form>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-card rounded-2xl p-6 shadow-active animate-fade-in text-center max-w-xs mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground text-lg">Share Registration</h3>
              <button onClick={() => setShowQR(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG value={registrationUrl} size={200} level="H" />
            </div>
            <p className="text-xs text-muted-foreground font-body mb-2">Scan to open registration form</p>
            <div className="bg-muted rounded-xl px-3 py-2">
              <p className="text-[10px] text-foreground font-body break-all">{registrationUrl}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(registrationUrl); }}
              className="mt-3 w-full py-2 rounded-xl bg-primary-soft text-primary text-xs font-semibold hover:opacity-80">
              Copy Link
            </button>
          </div>
        </div>
      )}

      {showPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowPDF(false)}>
          <div className="bg-card rounded-2xl w-full max-w-2xl h-[80vh] shadow-active animate-fade-in flex flex-col mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display font-bold text-foreground">Terms & Conditions</h2>
              <button onClick={() => setShowPDF(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <iframe src="/artneelam_terms_conditions.pdf" className="flex-1 w-full rounded-b-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="px-4 py-2.5 bg-primary-soft border-b border-border">
        <h3 className="font-display font-bold text-primary text-sm">{title}</h3>
      </div>
      <div className="p-3 space-y-3">{children}</div>
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
          className="w-full mt-1 px-3 py-2 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full mt-1 px-3 py-2 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
      )}
    </div>
  );
}
