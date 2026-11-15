
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

 
async function handleSubmit(e) {
  e.preventDefault();

  setMessage("");
  setError("");
  setLoading(true);

  try {
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      throw loginError;
    }

    if (!data.user) {
      throw new Error("Unable to verify your account.");
    }

    // Fetch user role
    const { data: membership, error: roleError } =
      await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

    if (roleError) {
      throw roleError;
    }

    if (!membership) {
      await supabase.auth.signOut();
      throw new Error("Your account is not linked to a business or client.");
    }

    // Redirect according to role
    if (membership.role === "client") {
      navigate("/portal");
    } else if (
      ["owner", "admin", "staff"].includes(membership.role)
    ) {
      navigate("/dashboard");
    } else {
      await supabase.auth.signOut();
      throw new Error("Your account role is not authorized.");
    }

  } catch (err) {
    setError(err.message || "Unable to sign in. Please try again.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">C</span>
          <span>
            Client<span className="brand-highlight">Desk</span>
          </span>
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">YOUR BUSINESS WORKSPACE</span>

          <h1>Everything in one place. Work with confidence.</h1>

          <p>
            Manage your clients, team, documents and daily operations
            from one secure workspace.
          </p>

          <div className="auth-benefit">
            <span>✓</span> Organized client management
          </div>

          <div className="auth-benefit">
            <span>✓</span> Better team collaboration
          </div>

          <div className="auth-benefit">
            <span>✓</span> Secure business workspace
          </div>
        </div>

        <p className="auth-panel-footer">© 2026 ClientDesk</p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-mobile-brand">
            <span className="brand-icon">C</span>
            Client<span className="brand-highlight">Desk</span>
          </Link>

          <span className="auth-eyebrow">WELCOME BACK</span>

          <h2>Sign in to your account</h2>

          <p className="auth-subtitle">
            Enter your details to access your workspace.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email address</label>

            <div className="auth-input-wrap">
              <Mail size={18} />

              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-label-row">
              <label>Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <div className="auth-input-wrap">
              <LockKeyhole size={18} />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>

            {message && (
              <p className="auth-message">{message}</p>
            )}

            {error && (
              <p className="auth-message" style={{ color: "red" }}>
                {error}
              </p>
            )}
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
