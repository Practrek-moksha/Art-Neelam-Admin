import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Demo mode: set to false for real authentication
const DEMO_MODE = false;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: "admin" | "parent" | null;
  loading: boolean;
  signOut: () => Promise<void>;
  demoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, role: null, loading: true, signOut: async () => {}, demoMode: DEMO_MODE,
});

const DEMO_USER = {
  id: "demo-admin-001",
  email: "admin@artneelam.studio",
  app_metadata: {},
  user_metadata: { display_name: "Admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"admin" | "parent" | null>(DEMO_MODE ? "admin" : null);
  const [loading, setLoading] = useState(DEMO_MODE ? false : true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole((data?.role as "admin" | "parent") ?? null);
  };

  useEffect(() => {
    if (DEMO_MODE) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!DEMO_MODE) {
      await supabase.auth.signOut();
    }
    setUser(DEMO_MODE ? DEMO_USER : null);
    setSession(null);
    setRole(DEMO_MODE ? "admin" : null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut, demoMode: DEMO_MODE }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
