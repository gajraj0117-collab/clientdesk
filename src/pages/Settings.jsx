
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Building2,
  Shield,
  Save,
  Lock,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        navigate("/login");
        return;
      }

      setUser(user);
      setFullName(user.user_metadata?.full_name || "");

      const { data, error: membershipError } = await supabase
        .from("memberships")
        .select("role, business_id, businesses(name)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        setMessage(membershipError.message);
      } else if (data) {
        setRole(data.role);
        setBusinessId(data.business_id);
        setBusinessName(data.businesses?.name || "");
      }

      setLoading(false);
    }

    loadSettings();
  }, [navigate]);

  async function saveProfile() {
    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated successfully!");
    }

    setSaving(false);
  }

  async function saveBusiness() {
    if (!businessName.trim()) {
      setMessage("Business name cannot be empty.");
      return;
    }

    if (role !== "owner") {
      setMessage("Only the business owner can edit business details.");
      return;
    }

    setSavingBusiness(true);
    setMessage("");

    const { error } = await supabase
      .from("businesses")
      .update({ name: businessName.trim() })
      .eq("id", businessId);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Business name updated successfully!");
    }

    setSavingBusiness(false);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate("/login");
  }

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </header>

      <main className="settings-main">
        <div className="settings-heading">
          <span>WORKSPACE PREFERENCES</span>
          <h1>Settings</h1>
          <p>Manage your profile and account preferences.</p>
        </div>

        {message && <div className="settings-message">{message}</div>}

        <section className="settings-card">
          <div className="settings-card-heading">
            <User size={21} />
            <div>
              <h2>Profile Settings</h2>
              <p>Manage your personal information.</p>
            </div>
          </div>

          <label>Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />

          <label>Email Address</label>
          <input value={user?.email || ""} disabled />

          <button onClick={saveProfile} disabled={saving}>
            <Save size={17} />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <Building2 size={21} />
            <div>
              <h2>Business Settings</h2>
              <p>Manage your business workspace details.</p>
            </div>
          </div>

          <label>Business Name</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={role !== "owner"}
            placeholder="Enter business name"
          />

          <label>Your Role</label>
          <input value={role} disabled />

          {role === "owner" && (
            <button onClick={saveBusiness} disabled={savingBusiness}>
              <Save size={17} />
              {savingBusiness ? "Saving..." : "Save Business Details"}
            </button>
          )}
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <Shield size={21} />
            <div>
              <h2>Security</h2>
              <p>Manage your account security.</p>
            </div>
          </div>

          <div className="settings-action">
            <div>
              <strong>Password</strong>
              <p>Change your account password.</p>
            </div>

            <button onClick={() => navigate("/forgot-password")}>
              <Lock size={16} />
              Reset Password
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <LogOut size={21} />
            <div>
              <h2>Account</h2>
              <p>Sign out from your account.</p>
            </div>
          </div>

          <button className="settings-logout" onClick={handleLogout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </section>
      </main>
    </div>
  );
}
