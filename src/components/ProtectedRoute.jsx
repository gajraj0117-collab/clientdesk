
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({
  children,
  allowedRoles = ["owner", "admin", "staff"],
}) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Session error:", error);
      }

      setSession(error ? null : data.session);
      setAuthLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchRole() {
      if (!session?.user?.id) {
        setRole(null);
        setRoleError("");
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      setRoleError("");

      const { data, error } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Membership role error:", error);
        setRoleError(error.message);
        setRole(null);
      } else {
        console.log("Logged-in user role:", data?.role);
        setRole(data?.role || null);
      }

      setRoleLoading(false);
    }

    fetchRole();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  if (authLoading || (session && roleLoading)) {
    return <div className="dashboard-loading">Checking authentication...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (roleError) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Membership Error</h2>
        <p>{roleError}</p>
      </div>
    );
  }

  if (!role) {
    return <div style={{ padding: 30 }}>No membership role found.</div>;
  }

  if (!allowedRoles.includes(role)) {
    if (role === "client") {
      return <Navigate to="/portal" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}