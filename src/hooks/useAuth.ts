import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "restaurant" | "organization" | "volunteer";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  role: AppRole;
  // Role-specific fields
  vehicleType?: string;
  organizationType?: string;
  location?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch user role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          setAuthState({
            user: session.user,
            session,
            role: roleData?.role as AppRole | null,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            role: null,
            isLoading: false,
          });
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        setAuthState({
          user: session.user,
          session,
          role: roleData?.role as AppRole | null,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpData) => {
    const { email, password, name, phone, address, role, vehicleType, organizationType, location } = data;

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Sign up failed");

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      phone,
      address,
    });

    if (profileError) throw profileError;

    // Create user role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
    });

    if (roleError) throw roleError;

    // Create role-specific record
    if (role === "restaurant") {
      const { error } = await supabase.from("restaurants").insert({
        user_id: userId,
        name,
        location: location || address,
      });
      if (error) throw error;
    } else if (role === "organization") {
      const { error } = await supabase.from("organizations").insert({
        user_id: userId,
        name,
        org_type: organizationType || "shelter",
        address,
      });
      if (error) throw error;
    } else if (role === "volunteer") {
      const { error } = await supabase.from("volunteers").insert({
        user_id: userId,
        name,
        vehicle_type: vehicleType,
      });
      if (error) throw error;
    }

    return authData;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
  };
}
