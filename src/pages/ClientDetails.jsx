
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  FileText,
  Pencil,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./ClientDetails.css";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [documents, setDocuments] = useState([]);
  const [businessId, setBusinessId] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    notes: "",
  });

  // Update client
  async function handleUpdateClient(e) {
    e.preventDefault();

    try {
      if (!/^[0-9]{10}$/.test(editForm.phone)) {
        alert("Mobile number exactly 10 digits ka hona chahiye.");
        return;
      }

      const updatedData = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone,
        company: editForm.company.trim(),
        service: editForm.service.trim(),
        notes: editForm.notes.trim(),
      };

      const { error: updateError } = await supabase
        .from("clients")
        .update(updatedData)
        .eq("id", id)
        .eq("business_id", businessId);

      if (updateError) throw updateError;

      setClient({
        ...client,
        ...updatedData,
      });

      setIsEditing(false);
      alert("Client updated successfully!");
    } catch (err) {
      alert(err.message || "Unable to update client.");
    }
  }

  // Download document
  async function handleDocumentDownload(doc) {
    try {
      const { data, error } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.file_path, 60);

      if (error) throw error;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(err.message || "Unable to download document.");
    }
  }

  // Upload document
  async function handleDocumentUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size 10 MB se kam honi chahiye.");
      e.target.value = "";
      return;
    }

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;
      if (!userData.user) throw new Error("Please login again.");

      if (!businessId) {
        throw new Error("Business information not found.");
      }

      const filePath = `${businessId}/${id}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("client_documents")
        .insert({
          business_id: businessId,
          client_id: id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: userData.user.id,
        });

      if (insertError) {
        await supabase.storage
          .from("client-documents")
          .remove([filePath]);

        throw insertError;
      }

      const { data: updatedDocuments, error: fetchError } =
        await supabase
          .from("client_documents")
          .select("*")
          .eq("client_id", id)
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setDocuments(updatedDocuments || []);
      alert("Document uploaded successfully!");
    } catch (err) {
      alert(err.message || "Unable to upload document.");
    } finally {
      e.target.value = "";
    }
  }

  // Delete document
  async function handleDocumentDelete(doc) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${doc.file_name}"?`
    );

    if (!confirmed) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("client-documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("client_documents")
        .delete()
        .eq("id", doc.id)
        .eq("business_id", businessId)
        .eq("client_id", id);

      if (deleteError) throw deleteError;

      setDocuments((prev) =>
        prev.filter((item) => item.id !== doc.id)
      );

      alert("Document deleted successfully!");
    } catch (err) {
      alert(err.message || "Unable to delete document.");
    }
  }

  // Load client and documents
  useEffect(() => {
    async function loadClient() {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;
        if (!userData.user) {
          throw new Error("Please login again.");
        }

        const { data: membership, error: membershipError } =
          await supabase
            .from("memberships")
            .select("business_id")
            .eq("user_id", userData.user.id)
            .limit(1)
            .maybeSingle();

        if (membershipError) throw membershipError;
        if (!membership) {
          throw new Error("Business membership not found.");
        }

        setBusinessId(membership.business_id);

        const { data, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .eq("business_id", membership.business_id)
          .single();

        if (clientError) throw clientError;

        setClient(data);

        const { data: documentData, error: documentError } =
          await supabase
            .from("client_documents")
            .select("*")
            .eq("client_id", id)
            .eq("business_id", membership.business_id)
            .order("created_at", { ascending: false });

        if (documentError) throw documentError;

        setDocuments(documentData || []);
      } catch (err) {
        setError(err.message || "Unable to load client.");
      } finally {
        setLoading(false);
        setDocumentsLoading(false);
      }
    }

    loadClient();
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading client details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-details-page">
        <div className="client-details-container">
          <p>{error}</p>

          <button
            className="client-back-btn"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft size={17} />
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="client-details-page">
      <div className="client-details-container">

        <button
          className="client-back-btn"
          onClick={() => navigate("/clients")}
        >
          <ArrowLeft size={17} />
          Back to Clients
        </button>

        {/* Client Profile Header */}
        <div className="client-profile-header">
          <div className="client-profile-identity">
            <div className="client-profile-avatar">
              {client.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1>{client.name}</h1>
              <p>{client.company || "Individual Client"}</p>
            </div>
          </div>

          <span className="client-profile-status">
            {client.status}
          </span>

          <button
            className="edit-client-btn"
            onClick={() => {
              setEditForm({
                name: client.name || "",
                email: client.email || "",
                phone: client.phone || "",
                company: client.company || "",
                service: client.service || "",
                notes: client.notes || "",
              });
              setIsEditing(true);
            }}
          >
            <Pencil size={15} />
            Edit Client
          </button>
        </div>

        {/* Edit Client Form */}
        {isEditing && (
          <div className="client-edit-form">
            <h2>Edit Client Information</h2>

            <form onSubmit={handleUpdateClient}>
              <div className="client-edit-grid">

                <div className="client-edit-field">
                  <label>Client Name</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="client-edit-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="client-edit-field">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        phone: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      })
                    }
                  />
                </div>

                <div className="client-edit-field">
                  <label>Company</label>
                  <input
                    value={editForm.company}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        company: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="client-edit-field full-width">
                  <label>Service</label>
                  <input
                    value={editForm.service}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        service: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="client-edit-field full-width">
                  <label>Notes</label>
                  <textarea
                    rows={4}
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

              </div>

              <div className="client-edit-actions">
                <button
                  type="submit"
                  className="client-save-btn"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  className="client-cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contact Information */}
        <h2 className="client-section-title">
          Contact Information
        </h2>

        <div className="client-info-grid">

          <div className="client-info-card">
            <div className="client-info-icon">
              <Mail size={20} />
            </div>
            <div>
              <span>Email Address</span>
              <strong>{client.email || "Not provided"}</strong>
            </div>
          </div>

          <div className="client-info-card">
            <div className="client-info-icon">
              <Phone size={20} />
            </div>
            <div>
              <span>Mobile Number</span>
              <strong>{client.phone || "Not provided"}</strong>
            </div>
          </div>

          <div className="client-info-card">
            <div className="client-info-icon">
              <Building2 size={20} />
            </div>
            <div>
              <span>Company</span>
              <strong>{client.company || "Individual Client"}</strong>
            </div>
          </div>

          <div className="client-info-card">
            <div className="client-info-icon">
              <Briefcase size={20} />
            </div>
            <div>
              <span>Service</span>
              <strong>{client.service || "Not assigned"}</strong>
            </div>
          </div>

        </div>

        {/* Additional Information */}
        <h2 className="client-section-title">
          Additional Information
        </h2>

        {/* Client Notes */}
        <div className="client-notes-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
              color: "#635bff",
            }}
          >
            <FileText size={19} />
            <strong>Client Notes</strong>
          </div>

          {client.notes || "No notes have been added for this client."}
        </div>

        {/* Client Documents */}
        <h2 className="client-section-title">
          Client Documents
        </h2>

        <div className="client-documents-card">

          <div className="client-document-upload">
            <label htmlFor="clientDocumentUpload">
              <Upload size={17} />
              Upload Document
            </label>

            <input
              id="clientDocumentUpload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              onChange={handleDocumentUpload}
            />

            <span>Maximum file size: 10 MB</span>
          </div>

          {documentsLoading ? (
            <p>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p>No documents uploaded for this client yet.</p>
          ) : (
            <div className="client-document-list">
              {documents.map((doc) => (
                <div
                  className="client-document-item"
                  key={doc.id}
                >
                  <div className="client-document-info">
                    <FileText size={20} />

                    <div>
                      <strong>{doc.file_name}</strong>
                      <span>
                        {new Date(doc.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="client-document-actions">
                    <button
                      className="client-document-download"
                      onClick={() => handleDocumentDownload(doc)}
                    >
                      <Download size={16} />
                      Download
                    </button>

                    <button
                      className="client-document-delete"
                      onClick={() => handleDocumentDelete(doc)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
