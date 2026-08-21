import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole;
  isOperator: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    pass: string,
    meta?: { fullName?: string; phone?: string; role?: AppRole },
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateRole: (newRole: AppRole) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole>("citizen");
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    try {
      // 1. Fetch Profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", userId)
        .maybeSingle();

      if (profData) {
        setProfile(profData);
      } else {
        setProfile(null);
      }

      // 2. Fetch User Role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleData?.role) {
        setRole(roleData.role);
      } else {
        setRole("citizen");
      }
    } catch (err) {
      console.error("Failed to load user profile/role:", err);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (currentSession?.user) {
      await fetchProfileAndRole(currentSession.user.id);
    } else {
      setProfile(null);
      setRole("citizen");
    }
  }, [fetchProfileAndRole]);

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        fetchProfileAndRole(initSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfileAndRole(newSession.user.id);
      } else {
        setProfile(null);
        setRole("citizen");
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (!error) {
      await refreshAuth();
    }
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    pass: string,
    meta?: { fullName?: string; phone?: string; role?: AppRole },
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: meta?.fullName || "",
          phone: meta?.phone || "",
        },
      },
    });

    if (!error && data.user && meta?.role && meta.role !== "citizen") {
      try {
        await supabase
          .from("user_roles")
          .upsert({ user_id: data.user.id, role: meta.role }, { onConflict: "user_id,role" });
        setRole(meta.role);
      } catch (err) {
        console.warn("Could not set custom role on signup:", err);
      }
    }

    if (!error) {
      await refreshAuth();
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole("citizen");
  };

  const updateRole = async (newRole: AppRole): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: newRole }, { onConflict: "user_id,role" });
      if (!error) {
        setRole(newRole);
        return true;
      }
      setRole(newRole);
      return true;
    } catch {
      setRole(newRole);
      return true;
    }
  };

  const isOperator = role === "responder" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isOperator,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        updateRole,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
