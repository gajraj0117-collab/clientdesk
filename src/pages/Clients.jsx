
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus, Search, Users, Mail, Phone, Building2, X, Pencil, Trash2, ArrowLeft,
} from "lucide-react";
import "./Clients.css";
import { useNavigate } from "react-router-dom";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [deletingClient, setDeletingClient] = useState(null);
  const [success, setSuccess] = useState("");

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;
      if (!userData.user) throw new Error("Please login again.");

      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .select("business_id")
          .eq("user_id", userData.user.id)
          .limit(1)
          .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership) throw new Error("Business workspace not found.");

      setBusinessId(membership.business_id);

      const { data, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false });

      if (clientError) throw clientError;

      setClients(data || []);
    } catch (err) {
      setError(err.message || "Unable to load clients.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleEdit(client) {
    setEditingClient(client);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      service: client.service || "",
      notes: client.notes || "",
    });

    setShowForm(true);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

async function handleDelete(client) {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${client.name}?`
  );

  if (!confirmed) return;

  setError("");
  setSuccess("");
  setDeletingClient(client.id);

  try {
    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id)
      .eq("business_id", businessId);

    if (deleteError) throw deleteError;

    setSuccess("Client deleted successfully!");

    await loadClients();
  } catch (err) {
    setError(err.message || "Unable to delete client.");
  } finally {
    setDeletingClient(null);
  }
}

  function closeForm() {
    setShowForm(false);
    setEditingClient(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!businessId) {
      setError("Business workspace not found.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please login again.");

      const clientData = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        service: form.service.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingClient) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", editingClient.id)
          .eq("business_id", businessId);

        if (updateError) throw updateError;

        setSuccess("Client updated successfully!");
      } else {
        const { error: insertError } = await supabase
          .from("clients")
          .insert({
            ...clientData,
            business_id: businessId,
            created_by: user.id,
          });

        if (insertError) throw insertError;

        setSuccess("Client added successfully!");
      }

      setForm(emptyForm);
      setEditingClient(null);
      setShowForm(false);

      await loadClients();
    } catch (err) {
      setError(err.message || "Unable to save client.");
    } finally {
      setSaving(false);
    }
  }

  const filteredClients = clients.filter((client) =>
    [
      client.name,
      client.email,
      client.phone,
      client.company,
      client.service,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="clients-page">
      <button
  className="clients-back-btn"
  onClick={() => navigate("/dashboard")}
>
  <ArrowLeft size={18} />
  Back to Dashboard
</button>
      <div className="clients-header">
        <div>
          <span className="clients-eyebrow">WORKSPACE</span>
          <h1>Clients</h1>
          <p>Manage and organize all your business clients.</p>
        </div>

        <button
          className="add-client-btn"
          onClick={() => {
            if (showForm) {
              closeForm();
            } else {
              setEditingClient(null);
              setForm(emptyForm);
              setError("");
              setShowForm(true);
            }
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close" : "Add Client"}
        </button>
      </div>

      {error && <div className="clients-alert error">{error}</div>}
      {success && <div className="clients-alert success">{success}</div>}

      {showForm && (
        <form className="client-form" onSubmit={handleSubmit}>
          <h2>{editingClient ? "Edit Client" : "Add New Client"}</h2>

          <div className="client-form-grid">
            <div className="client-field">
              <label>Client Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="client-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="client@example.com"
              />
            </div>

            <div className="client-field">
              <label>Phone Number</label>
              
<input
  type="tel"
  name="phone"
  value={form.phone}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, phone: value });
  }}
  placeholder="Enter 10 digit mobile number"
  inputMode="numeric"
  maxLength={10}
  pattern="[0-9]{10}"
  title="Please enter exactly 10 digits"
  required
/>

            </div>

            <div className="client-field">
              <label>Company</label>
              <input
                name="company"
                value={form.company}
                onChange={updateField}
                placeholder="Company name"
              />
            </div>

            <div className="client-field">
              <label>Service</label>
              <input
                name="service"
                value={form.service}
                onChange={updateField}
                placeholder="e.g. Accounting, Tax"
              />
            </div>

            <div className="client-field">
              <label>Notes</label>
              <input
                name="notes"
                value={form.notes}
                onChange={updateField}
                placeholder="Additional information"
              />
            </div>
          </div>

          <button
            className="save-client-btn"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingClient
                ? "Update Client"
                : "Save Client"}
          </button>
        </form>
      )}

      <div className="clients-toolbar">
        <div>
          <div className="clients-count">{clients.length}</div>
          <div className="clients-count-label">Total Clients</div>
        </div>

        <div className="clients-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
          />
        </div>
      </div>

      <div className="clients-list">
        {loading ? (
          <div className="clients-empty">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="clients-empty">
            <Users size={35} />
            <h3>No clients found</h3>
            <p>Add your first client to get started.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div className="client-card" key={client.id}>
              <div className="client-avatar">
                {client.name.charAt(0).toUpperCase()}
              </div>

              <div className="client-main-info">
  <h3
    onClick={() => navigate(`/clients/${client.id}`)}
    style={{
      cursor: "pointer",
      color: "#635bff",
    }}
    title="View client details"
  >
    {client.name}
  </h3>

  <p>{client.company || "Individual Client"}</p>
</div>

              <div className="client-detail">
                <Mail size={15} />
                <span>{client.email || "No email"}</span>
              </div>

              <div className="client-detail">
                <Phone size={15} />
                <span>{client.phone || "No phone"}</span>
              </div>

              <div className="client-service">
                <Building2 size={15} />
                {client.service || "No service"}
              </div>

              <div className="client-actions">
                <span className="client-status">{client.status}</span>
                 <button
  className="edit-client-btn"
  onClick={() => handleEdit(client)}
  title="Edit client"
>
  <Pencil size={15} />
  Edit
</button>
                <button
  className="delete-client-btn"
  onClick={() => handleDelete(client)}
  disabled={deletingClient === client.id}
  title="Delete client"
>
  <Trash2 size={15} />
  {deletingClient === client.id ? "Deleting..." : "Delete"}
</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
