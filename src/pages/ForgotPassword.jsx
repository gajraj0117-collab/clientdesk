
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Mail } from "lucide-react";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
  e.preventDefault();

  setMessage("Sending reset link...");

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    setMessage(
      "Password reset link sent! Please check your email and spam folder."
    );
  } catch (error) {
    setMessage(error.message || "Unable to send reset email.");
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
          <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
          <h1>Let's get you back to work.</h1>
          <p>We will help you recover access to your ClientDesk workspace.</p>
        </div>
        <p className="auth-panel-footer">© 2026 ClientDesk</p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-mobile-brand">
            <span className="brand-icon">C</span>
            Client<span className="brand-highlight">Desk</span>
          </Link>

          <span className="auth-eyebrow">PASSWORD RECOVERY</span>
          <h2>Forgot your password?</h2>
          <p className="auth-subtitle">Enter your registered email address. We'll help you reset your password.</p>

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

            <button className="auth-submit" type="submit">
              Continue
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
