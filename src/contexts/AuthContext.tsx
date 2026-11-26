import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/db-client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface SubadminPerms {
  can_manage_jobs: boolean;
  can_view_applications: boolean;
  can_manage_templates: boolean;
  can_manage_headlines: boolean;
  can_manage_banners: boolean;
  can_view_messages: boolean;
  can_view_analytics: boolean;
  can_view_users: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isSubadmin: boolean;
  subadminPerms: SubadminPerms | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [subadminPerms, setSubadminPerms] = useState<SubadminPerms | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const userRoles = data?.map((r) => r.role) || [];
    setRoles(userRoles);
    
    if (userRoles.includes("subadmin")) {
      const { data: perms } = await supabase
        .from("subadmin_permissions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      setSubadminPerms(perms as SubadminPerms | null);
    } else {
      setSubadminPerms(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer the queries (never await inside the auth callback), and only finish
          // loading once roles are known so admin pages don't bounce on reload.
          const uid = session.user.id;
          setTimeout(() => {
            fetchProfile(uid);
            fetchRoles(uid).finally(() => setLoading(false));
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setSubadminPerms(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setSubadminPerms(null);
  };

  const isAdmin = roles.includes("admin");
  const isSubadmin = roles.includes("subadmin");

  return (
    <AuthContext.Provider
      value={{ user, session, profile, roles, loading, isAdmin, isSubadmin, subadminPerms, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
