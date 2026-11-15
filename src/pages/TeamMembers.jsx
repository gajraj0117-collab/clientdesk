
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  ArrowLeft,
  RefreshCw,
  UserPlus,
  Mail,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TeamMembers.css";

export default function TeamMembers() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .select("business_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership) throw new Error("Business workspace not found.");

      if (!["owner", "admin"].includes(membership.role)) {
        throw new Error("You do not have permission to view team members.");
      }

      setBusinessId(membership.business_id);

      const { data: teamData, error: teamError } =
        await supabase
          .from("memberships")
          .select("user_id, role, created_at")
          .eq("business_id", membership.business_id)
          .order("created_at", { ascending: true });

      if (teamError) throw teamError;

      const memberIds = (teamData || []).map(
        (member) => member.user_id
      );

      let profiles = [];

      if (memberIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", memberIds);

        if (profileError) throw profileError;
        profiles = profileData || [];
      }

      const profileMap = Object.fromEntries(
        profiles.map((profile) => [profile.id, profile])
      );

      setMembers(
        (teamData || []).map((member) => ({
          ...member,
          full_name:
            profileMap[member.user_id]?.full_name || "Unnamed Member",
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to load team members.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();

    try {
      setSending(true);
      setError("");
      setSuccess("");

      if (!name.trim() || !email.trim()) {
        throw new Error("Please enter staff name and email.");
      }

      const { data, error: inviteError } =
        await supabase.functions.invoke("invite-staff", {
          body: {
            name: name.trim(),
            email: email.trim(),
            business_id: businessId,
          },
        });

      if (inviteError) throw inviteError;
      if (data?.error) throw new Error(data.error);
      if (!data?.success) {
        throw new Error("Invitation could not be completed.");
      }

      setSuccess("Invitation sent successfully!");
      setName("");
      setEmail("");

      await loadMembers();
    } catch (err) {
      setError(err.message || "Unable to send invitation.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <main className="team-page">
      <div className="team-container">
        <button
          className="team-back"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="team-header">
          <div>
            <p>WORKSPACE MANAGEMENT</p>
            <h1>Team Members</h1>
            <span>Manage your business workspace members.</span>
          </div>

          <button
            className="team-refresh"
            onClick={loadMembers}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {error && <div className="team-error">{error}</div>}
        {success && <div className="team-success">{success}</div>}

        <div className="team-summary">
          <div className="team-summary-icon">
            <Users size={24} />
          </div>
          <div>
            <h3>{members.length}</h3>
            <p>Total Team Members</p>
          </div>
        </div>

        <div className="team-card team-invite-card">
          <div className="team-card-heading">
            <h2>
              <UserPlus size={20} />
              Invite Staff Member
            </h2>
          </div>

          <form className="team-invite-form" onSubmit={handleInvite}>
            <div className="team-form-group">
              <label>Staff Name</label>
              <div className="team-input-wrapper">
                <User size={18} />
                <input
                  type="text"
                  placeholder="Enter staff full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="team-form-group">
              <label>Staff Email</label>
              <div className="team-input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Enter staff email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="team-invite-btn"
              disabled={sending || !businessId}
            >
              <UserPlus size={18} />
              {sending ? "Sending Invitation..." : "Send Invitation"}
            </button>
          </form>
        </div>

        <div className="team-card">
          <div className="team-card-heading">
            <h2>All Members</h2>
            <span>{members.length} members</span>
          </div>

          {loading ? (
            <div className="team-empty">Loading team members...</div>
          ) : members.length === 0 ? (
            <div className="team-empty">
              No team members found.
            </div>
          ) : (
            <div className="team-list">
              {members.map((member) => (
                <div
                  className="team-member"
                  key={member.user_id}
                >
                  <div className="team-avatar">
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="team-member-info">
                    <h3>{member.full_name}</h3>
                    <p>{member.role}</p>
                  </div>

                  <span className={`team-role ${member.role}`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
