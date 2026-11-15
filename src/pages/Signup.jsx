
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Building2,
  UserRound,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    owner: "",
    business: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.owner.trim(),
              business_name: form.business.trim(),
            },
          },
        });

      if (signupError) {
        throw signupError;
      }

      if (data.user) {
        if (data.session) {
          setMessage(
            "Your account and business workspace have been created successfully! You can now sign in."
          );
        } else {
          setMessage(
            "Registration successful! Please check your email and confirm your account. Your business workspace has been created."
          );
        }

        setForm({
          owner: "",
          business: "",
          email: "",
          password: "",
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
          <span className="auth-eyebrow">
            ONE WORKSPACE. BETTER BUSINESS.
          </span>

          <h1>Build a more organized business with ClientDesk.</h1>

          <p>
            Create your own business workspace and bring your team and
            clients together.
          </p>

          <div className="auth-benefit">
            <span>✓</span> Your own business workspace
          </div>

          <div className="auth-benefit">
            <span>✓</span> Manage your employees
          </div>

          <div className="auth-benefit">
            <span>✓</span> Organize all your clients
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

          <span className="auth-eyebrow">GET STARTED</span>

          <h2>Create your workspace</h2>

          <p className="auth-subtitle">
            Start managing your business with ClientDesk.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Your full name</label>

            <div className="auth-input-wrap">
              <UserRound size={18} />
              <input
                name="owner"
                placeholder="John Smith"
                value={form.owner}
                onChange={updateField}
                required
              />
            </div>

            <label>Business name</label>

            <div className="auth-input-wrap">
              <Building2 size={18} />
              <input
                name="business"
                placeholder="Your company name"
                value={form.business}
                onChange={updateField}
                required
              />
            </div>

            <label>Business email</label>

            <div className="auth-input-wrap">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={updateField}
                required
              />
            </div>

            <label>Create password</label>

            <div className="auth-input-wrap">
              <LockKeyhole size={18} />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 8 characters"
                minLength={8}
                value={form.password}
                onChange={updateField}
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
              {loading ? "Creating workspace..." : "Create workspace"}
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
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-terms">
            By creating an account, you agree to our Terms of Service
            and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
