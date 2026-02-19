import { useState } from "react";
import { Settings as SettingsIcon, Key, Globe, Bell, Shield, ChevronRight, Copy, Check } from "lucide-react";

export default function Settings() {
  const [apiKey] = useState("nas_live_sk_" + Math.random().toString(36).substr(2, 24));
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://artneelam.studio/api/leads");
  const [settings, setSettings] = useState({
    emailNotifications: true,
    whatsappAlerts: true,
    autoFollowUp: false,
    birthdayReminders: true,
    feeReminders: true,
  });

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (key: keyof typeof settings) => {
    setSettings(p => ({ ...p, [key]: !p[key] }));
  };

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
          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Lead Webhook Endpoint</label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="bg-accent rounded-xl p-3">
            <p className="text-xs font-bold text-accent-foreground font-body mb-1">Integration Guide</p>
            <p className="text-[10px] text-accent-foreground font-body">POST to the webhook endpoint with: name, phone, email, course, source fields. Include API key in Authorization header.</p>
          </div>
        </div>
      </Section>

      {/* Studio Info */}
      <Section icon={<Globe className="w-4 h-4 text-primary" />} title="Studio Information">
        <div className="space-y-3">
          {[
            { label: "Studio Name", value: "Art Neelam Studio" },
            { label: "Address", value: "123 Creative Lane, Delhi" },
            { label: "Phone", value: "+91 98765 43210" },
            { label: "Email", value: "info@artneelam.studio" },
            { label: "Website", value: "artneelam.studio" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-muted-foreground font-body">{f.label}</label>
              <input defaultValue={f.value}
                className="w-full mt-1 px-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={<Bell className="w-4 h-4 text-primary" />} title="Notifications">
        <div className="space-y-2">
          {[
            { key: "emailNotifications", label: "Email Notifications", desc: "Receive email alerts for new leads" },
            { key: "whatsappAlerts", label: "WhatsApp Alerts", desc: "Get WhatsApp messages for important updates" },
            { key: "autoFollowUp", label: "Auto Follow-up Reminder", desc: "Remind when follow-up date passes" },
            { key: "birthdayReminders", label: "Birthday Reminders", desc: "Get notified 3 days before student birthdays" },
            { key: "feeReminders", label: "Fee Due Reminders", desc: "Auto-remind students with pending fees" },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-semibold font-body text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground font-body">{s.desc}</p>
              </div>
              <button onClick={() => toggle(s.key as keyof typeof settings)}
                className={`w-11 h-6 rounded-full transition-all relative ${settings[s.key as keyof typeof settings] ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-all ${settings[s.key as keyof typeof settings] ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section icon={<Shield className="w-4 h-4 text-primary" />} title="Access & Security">
        <div className="space-y-2">
          {[
            { label: "Change Admin Password", desc: "Update your login credentials" },
            { label: "Parent Portal Access", desc: "Manage parent login settings" },
            { label: "Export Data", desc: "Download all studio data as CSV" },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted px-2 rounded-lg transition-colors">
              <div className="text-left">
                <p className="text-sm font-semibold font-body text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground font-body">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </Section>

      {/* Save Button */}
      <button className="w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold font-body text-sm hover:opacity-90 transition-opacity shadow-active">
        Save Settings
      </button>

      <p className="text-center text-[10px] text-muted-foreground font-body pb-4">
        Art Neelam Studio Management System v1.0 • Built with ❤️
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
