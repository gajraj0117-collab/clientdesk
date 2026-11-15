
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Save } from "lucide-react";
import "./Tasks.css";

export default function NewTask() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [businessId, setBusinessId] = useState("");
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    async function loadForm() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate("/login");
          return;
        }

        setUser(user);

        const { data: membership, error: membershipError } =
          await supabase
            .from("memberships")
            .select("business_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

        if (membershipError) throw membershipError;
        if (!membership) throw new Error("Business workspace not found.");

        setBusinessId(membership.business_id);

        const { data: clientData, error: clientError } =
          await supabase
            .from("clients")
            .select("id, name")
            .eq("business_id", membership.business_id)
            .order("name");

        if (clientError) throw clientError;
        setClients(clientData || []);

        const { data: memberData, error: memberError } =
          await supabase
            .from("memberships")
            .select("user_id, role")
            .eq("business_id", membership.business_id)
            .in("role", ["owner", "admin", "staff"]);

        if (memberError) throw memberError;

        const memberIds = (memberData || []).map(
          (member) => member.user_id
        );

        if (memberIds.length > 0) {
          const { data: profileData, error: profileError } =
            await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", memberIds);

          if (profileError) throw profileError;

          setStaff(
            (profileData || []).filter(
              (profile) => profile.id !== user.id
            )
          );
        }
      } catch (err) {
        setError(err.message || "Unable to load form.");
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { error: insertError } = await supabase
        .from("tasks")
        .insert({
          business_id: businessId,
          client_id: clientId || null,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          status,
          assigned_to: assignedTo || null,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      navigate("/tasks");
    } catch (err) {
      setError(err.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading form...</div>;
  }

  return (
    <main className="new-task-page">
      <button
        className="new-task-back"
        onClick={() => navigate("/tasks")}
      >
        <ArrowLeft size={18} />
        Back to Tasks
      </button>

      <div className="new-task-card">
        <div className="new-task-heading">
          <p>WORKSPACE MANAGEMENT</p>
          <h1>Create New Task</h1>
          <span>Add a new task to your business workspace.</span>
        </div>

        {error && <div className="new-task-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="new-task-field">
            <label>Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Prepare GST Return"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="new-task-field">
            <label>Description</label>
            <textarea
              placeholder="Enter task details..."
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="new-task-field">
            <label>Select Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">No client selected</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="new-task-field">
            <label>Assign To Staff</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || "Unnamed Staff"}
                </option>
              ))}
            </select>
          </div>

          <div className="new-task-grid">
            <div className="new-task-field">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="new-task-field">
              <label>Task Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="new-task-save"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Creating..." : "Create Task"}
          </button>
        </form>
      </div>
    </main>
  );
}
