
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Upload,
  Search,
  FileText,
  Download,
  Trash2,
  FolderOpen,
} from "lucide-react";
import "./Documents.css";

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
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
      if (!membership) throw new Error("Business membership not found.");

      setBusinessId(membership.business_id);

      const { data: clientData, error: clientError } =
        await supabase
          .from("clients")
          .select("id, name")
          .eq("business_id", membership.business_id)
          .order("name");

      if (clientError) throw clientError;

      setClients(clientData || []);
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    const { data, error: documentError } = await supabase
      .from("client_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (documentError) throw documentError;

    setDocuments(data || []);
  }

  const filteredDocuments = documents.filter((doc) => {
    const client = clients.find((c) => c.id === doc.client_id);

    const matchesSearch =
      doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase());

    const matchesClient =
      !selectedClient || doc.client_id === selectedClient;

    return matchesSearch && matchesClient;
  });

  async function handleUpload(e) {
    e.preventDefault();

    const file = e.target.elements.documentFile.files[0];

    if (!file || !selectedClient) {
      setError("Please select a client and a file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size cannot exceed 10 MB.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const filePath =
        `${businessId}/${selectedClient}/${crypto.randomUUID()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("client-documents")
        .upload(filePath, file);

      if (storageError) throw storageError;

      const { error: insertError } = await supabase
        .from("client_documents")
        .insert({
          business_id: businessId,
          client_id: selectedClient,
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

      setSuccess("Document uploaded successfully!");
      e.target.reset();
      setSelectedClient("");
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    try {
      setError("");

      const { data, error } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.file_path, 60);

      if (error) throw error;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Download failed.");
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete ${doc.file_name}?`)) return;

    try {
      setError("");
      setSuccess("");

      const { error: storageError } = await supabase.storage
        .from("client-documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("client_documents")
        .delete()
        .eq("id", doc.id);

      if (deleteError) throw deleteError;

      setSuccess("Document deleted successfully!");
      await loadDocuments();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading documents...</div>;
  }

  return (
    <div className="documents-page">
      <button
  className="documents-back-btn"
  onClick={() => navigate("/dashboard")}
>
  <ArrowLeft size={18} />
  Back to Dashboard
</button>
      <div className="documents-header">
        <div>
          <h1>Documents</h1>
          <p>Manage and organize your client documents.</p>
        </div>
      </div>

      {error && (
        <div className="documents-alert documents-error">
          {error}
        </div>
      )}

      {success && (
        <div className="documents-alert documents-success">
          {success}
        </div>
      )}

      <div className="documents-upload-card">
        <h3 className="documents-section-title">
          <Upload size={19} />
          Upload Document
        </h3>

        <form onSubmit={handleUpload} className="documents-upload-form">
          <div className="documents-field">
            <label>Select Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="documents-field">
            <label>Choose Document</label>
            <input
              type="file"
              name="documentFile"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              required
            />
          </div>

          <button
            type="submit"
            className="documents-upload-btn"
            disabled={uploading}
          >
            <Upload size={17} />
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </div>

      <section className="documents-list-section">
        <div className="documents-list-header">
          <h2>All Documents ({filteredDocuments.length})</h2>

          <div className="documents-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search documents or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="documents-empty">
            <FolderOpen size={38} />
            <h3>No documents found</h3>
            <p>Uploaded client documents will appear here.</p>
          </div>
        ) : (
          <div className="documents-list">
            {filteredDocuments.map((doc) => {
              const client = clients.find(
                (c) => c.id === doc.client_id
              );

              return (
                <div className="document-card" key={doc.id}>
                  <div className="document-info">
                    <div className="document-icon">
                      <FileText size={23} />
                    </div>

                    <div className="document-details">
                      <strong>{doc.file_name}</strong>
                      <p>{client?.name || "Unknown client"}</p>
                      <small>
                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        {" · "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  <div className="document-actions">
                    <button
                      className="document-action-btn document-download-btn"
                      onClick={() => handleDownload(doc)}
                      title="Download document"
                    >
                      <Download size={17} />
                    </button>

                    <button
                      className="document-action-btn document-delete-btn"
                      onClick={() => handleDelete(doc)}
                      title="Delete document"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
