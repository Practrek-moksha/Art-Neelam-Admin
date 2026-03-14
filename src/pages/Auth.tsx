import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setMessage("Password reset link sent to your email.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImg} alt="Art Neelam" className="w-16 h-16 rounded-2xl shadow-active mx-auto mb-4 object-contain" />
          <h1 className="font-display text-2xl font-bold text-foreground">Art Neelam Academy</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {mode === "login" ? "Sign in to your account" : mode === "signup" ? "Create your account" : "Reset your password"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-card border border-border p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground font-body">Display Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name" required
                  className="w-full pl-9 pr-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground font-body">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full pl-9 pr-3 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground font-body">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 bg-muted rounded-xl border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <button type="button" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
              className="text-xs text-primary font-semibold hover:underline font-body">
              Forgot Password?
            </button>
          )}

          {error && <p className="text-xs text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          {message && <p className="text-xs text-accent-foreground font-body bg-accent px-3 py-2 rounded-lg">{message}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </button>

          <p className="text-center text-xs text-muted-foreground font-body">
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                  className="text-primary font-semibold hover:underline">Sign Up</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  className="text-primary font-semibold hover:underline">Sign In</button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
