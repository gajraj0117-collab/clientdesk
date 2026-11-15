
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      setMessage("Password kam se kam 8 characters ka hona chahiye.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords match nahi kar rahe.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage("Password successfully updated!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(error.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">C</span>
          <span>Client<span className="brand-highlight">Desk</span></span>
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">ACCOUNT SECURITY</span>
          <h1>Create a new password.</h1>
          <p>Secure your workspace with a new password.</p>
        </div>

        <p className="auth-panel-footer">© 2026 ClientDesk</p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <span className="auth-eyebrow">RESET PASSWORD</span>
          <h2>Set new password</h2>
          <p className="auth-subtitle">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit}>
            <label>New Password</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <label>Confirm Password</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Enter password again"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>

            {message && <p className="auth-message">{message}</p>}
          </form>

          <Link to="/login" className="auth-back">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
