import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, Globe, Bell, Shield, ChevronRight, Copy, Check, Download, Lock, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SettingsMap = Record<string, string>;

export default function Settings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("academy_settings").select("key, value");
      if (error) { toast.error("Failed to load settings"); console.error(error); }
      const map: SettingsMap = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      setSettings(map);
      setLoading(false);
    })();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from("academy_settings").upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      }
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const apiKey = "nas_live_sk_" + "artneelam2024secure";

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Password updated successfully!"); setShowPasswordForm(false); setNewPassword(""); setConfirmPassword(""); }
    setChangingPassword(false);
  };

  const exportData = async (table: string) => {
    setExporting(true);
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      if (!data || data.length === 0) { toast.error(`No data in ${table}`); setExporting(false); return; }
      
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map(row => headers.map(h => {
          const val = (row as any)[h];
          const str = val === null ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(","))
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${table}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`${table} exported!`);
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    }
    setExporting(false);
  };

  const notificationKeys = [
    { key: "notifications_email", label: "Email Notifications", desc: "Receive email alerts for new leads" },
    { key: "notifications_whatsapp", label: "WhatsApp Alerts", desc: "Get WhatsApp messages for important updates" },
    { key: "notifications_auto_followup", label: "Auto Follow-up Reminder", desc: "Remind when follow-up date passes" },
    { key: "notifications_birthday", label: "Birthday Reminders", desc: "Get notified 3 days before student birthdays" },
    { key: "notifications_fee_reminder", label: "Fee Due Reminders", desc: "Auto-remind students with pending fees" },
  ];

  if (loading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>

      {/* API Configuration */}
      <Section icon={<Key className="w-4 h-4 text-primary" />} title="API Configuration">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">API Key (for website integration)</label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 px-3 py-2.5 bg-muted rounded-xl border border-border font-mono text-xs text-foreground truncate">{apiKey}</div>
              <button onClick={copyKey} className={`px-3 py-2.5 rounded-xl text-xs font-semibold font-body transition-all ${copied ? "bg-accent text-accent-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-1.5">Use this key to authenticate lead form submissions from your website</p>
          </div>
          <div className="bg-accent rounded-xl p-3">
            <p className="text-xs font-bold text-accent-foreground font-body mb-1">Integration Guide</p>
            <p className="text-[10px] text-accent-foreground font-body">POST to the webhook endpoint with: name, phone, email, course, source fields. Include API key in Authorization header.</p>
          </div>
        </div>
      </Section>

      {/* Academy Info */}
      <Section icon={<Globe className="w-4 h-4 text-primary" />} title="Academy Information">
        <div className="space-y-3">
          {[
            { key: "academy_name", label: "Academy Name" },
            { key: "address", label: "Address" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "website", label: "Website" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-muted-foreground font-body">{f.label}</label>
              <input value={settings[f.key] || ""} onChange={e => updateSetting(f.key, e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={<Bell className="w-4 h-4 text-primary" />} title="Notifications">
        <div className="space-y-2">
          {notificationKeys.map(s => (
            <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-semibold font-body text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground font-body">{s.desc}</p>
              </div>
              <button onClick={() => updateSetting(s.key, settings[s.key] === "true" ? "false" : "true")}
                className={`w-11 h-6 rounded-full transition-all relative ${settings[s.key] === "true" ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${settings[s.key] === "true" ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section icon={<Shield className="w-4 h-4 text-primary" />} title="Access & Security">
        <div className="space-y-2">
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center justify-between py-3 border-b border-border hover:bg-muted px-2 rounded-lg transition-colors">
            <div className="text-left">
              <p className="text-sm font-semibold font-body text-foreground">Change Admin Password</p>
              <p className="text-[10px] text-muted-foreground font-body">Update your login credentials</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
          </button>

          {showPasswordForm && (
            <div className="space-y-3 px-2 pb-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters" minLength={6}
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground font-body">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={handleChangePassword} disabled={changingPassword}
                className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          )}

          <div className="border-b border-border" />

          <div className="px-2 py-3">
            <p className="text-sm font-semibold font-body text-foreground mb-1">Export Data</p>
            <p className="text-[10px] text-muted-foreground font-body mb-3">Download academy data as CSV files</p>
            <div className="grid grid-cols-2 gap-2">
              {["students", "leads", "payments", "attendance", "expenses", "registrations"].map(table => (
                <button key={table} onClick={() => exportData(table)} disabled={exporting}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold font-body text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50">
                  <Download className="w-3 h-3" />
                  {table.charAt(0).toUpperCase() + table.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Save Button */}
      <button onClick={saveSettings} disabled={saving}
        className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold font-body text-sm hover:opacity-90 transition-opacity shadow-active disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>

      <p className="text-center text-[10px] text-muted-foreground font-body pb-4">
        Art Neelam Academy Management System v1.0 • Built with ❤️
      </p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
        {icon}
        <h2 className="font-display font-bold text-foreground text-base">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
