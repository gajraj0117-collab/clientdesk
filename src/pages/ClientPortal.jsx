
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ClipboardList,
  Clock,
  CheckCircle,
  Download,
  LogOut,
  RefreshCw,
  Upload,
  Send,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./ClientPortal.css";

export default function ClientPortal() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [error, setError] = useState("");

  const [requestTitle, setRequestTitle] = useState("");
  const [requestType, setRequestType] = useState("General Query");
  const [requestDescription, setRequestDescription] = useState("");

  async function loadPortal() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      const { data: clientData, error: clientError } =
        await supabase
          .from("clients")
          .select("id, business_id, name, email, company, service")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        throw new Error("Your client account is not linked.");
      }

      setClient(clientData);

      const [
        documentsResult,
        tasksResult,
        requestsResult,
      ] = await Promise.all([
        supabase
          .from("client_documents")
          .select("id, file_name, file_path, file_type, file_size, created_at")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("tasks")
          .select("id, title, description, status, due_date")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("client_requests")
          .select("id, title, request_type, description, status, created_at")
          .eq("client_id", clientData.id)
          .order("created_at", { ascending: false }),
      ]);

      if (documentsResult.error) throw documentsResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (requestsResult.error) throw requestsResult.error;

      setDocuments(documentsResult.data || []);
      setTasks(tasksResult.data || []);
      setRequests(requestsResult.data || []);

    } catch (err) {
      setError(err.message || "Unable to load your portal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortal();
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, images, Word and Excel files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again.");
      }

      if (!client) {
        throw new Error("Client profile not found.");
      }

      const filePath = `${client.business_id}/${client.id}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error("Storage Error: " + uploadError.message);
      }

      const { error: insertError } = await supabase
        .from("client_documents")
        .insert({
          business_id: client.business_id,
          client_id: client.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (insertError) {
        await supabase.storage
          .from("client-documents")
          .remove([filePath]);

        throw new Error("Database Error: " + insertError.message);
      }

      alert("Document uploaded successfully!");
      await loadPortal();

    } catch (err) {
      alert(err.message || "Unable to upload document.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDownload(document) {
    try {
      const { data, error } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(document.file_path, 60);

      if (error) throw error;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(err.message || "Unable to download document.");
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();

    if (!requestTitle.trim() || !requestDescription.trim()) {
      alert("Please fill in the request title and description.");
      return;
    }

    if (!client) {
      alert("Client profile not found.");
      return;
    }

    setSubmittingRequest(true);

    try {
      const { error } = await supabase
        .from("client_requests")
        .insert({
          business_id: client.business_id,
          client_id: client.id,
          title: requestTitle.trim(),
          request_type: requestType,
          description: requestDescription.trim(),
        });

      if (error) throw error;

      alert("Your request has been submitted successfully!");

      setRequestTitle("");
      setRequestType("General Query");
      setRequestDescription("");

      await loadPortal();

    } catch (err) {
      alert(err.message || "Unable to submit your request.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/login");
  }

  if (loading) {
    return (
      <div className="portal-loading">
        Loading your portal...
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-error">
        <h2>Unable to open Client Portal</h2>
        <p>{error}</p>
        <button onClick={loadPortal}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "Completed"
  ).length;

  return (
    <div className="client-portal">
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-brand-icon">C</span>
          <span>Client<span>Desk</span></span>
        </div>

        <button className="portal-logout" onClick={handleLogout}>
          <LogOut size={17} />
          Sign Out
        </button>
      </header>

      <main className="portal-main">
        <section className="portal-welcome">
          <div>
            <span className="portal-eyebrow">CLIENT WORKSPACE</span>
            <h1>Welcome, {client?.name}!</h1>
            <p>Manage your documents and track your work progress.</p>
          </div>
          <div className="portal-avatar">
            {client?.name?.charAt(0)?.toUpperCase()}
          </div>
        </section>

        <section className="portal-profile">
          <div>
            <span>Company</span>
            <strong>{client?.company || "Not provided"}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{client?.email || "Not provided"}</strong>
          </div>
          <div>
            <span>Service</span>
            <strong>{client?.service || "Not provided"}</strong>
          </div>
        </section>

        <section className="portal-stats">
          <div className="portal-stat-card">
            <div className="portal-stat-icon purple">
              <ClipboardList size={22} />
            </div>
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </div>

          <div className="portal-stat-card">
            <div className="portal-stat-icon orange">
              <Clock size={22} />
            </div>
            <span>Pending Tasks</span>
            <strong>{pendingTasks}</strong>
          </div>

          <div className="portal-stat-card">
            <div className="portal-stat-icon green">
              <CheckCircle size={22} />
            </div>
            <span>Completed Tasks</span>
            <strong>{completedTasks}</strong>
          </div>

          <div className="portal-stat-card">
            <div className="portal-stat-icon blue">
              <FileText size={22} />
            </div>
            <span>My Documents</span>
            <strong>{documents.length}</strong>
          </div>
        </section>

        <section className="portal-section">
          <div className="portal-section-heading">
            <div>
              <h2>My Tasks</h2>
              <p>Track the progress of your work.</p>
            </div>
            <button onClick={loadPortal} className="portal-refresh">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="portal-empty">
              No tasks assigned yet.
            </div>
          ) : (
            <div className="portal-table-wrap">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        {task.description && (
                          <small>{task.description}</small>
                        )}
                      </td>
                      <td>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : "Not set"}
                      </td>
                      <td>
                        <span className={`portal-status ${task.status
                          .toLowerCase()
                          .replace(" ", "-")}`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="portal-section">
          <div className="portal-section-heading">
            <div>
              <h2>My Documents</h2>
              <p>Your uploaded and shared documents.</p>
            </div>

            <label className="portal-upload-btn">
              <Upload size={17} />
              {uploading ? "Uploading..." : "Upload Document"}

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                onChange={handleUpload}
                disabled={uploading}
                hidden
              />
            </label>
          </div>

          {documents.length === 0 ? (
            <div className="portal-empty">
              No documents available yet.
            </div>
          ) : (
            <div className="portal-documents">
              {documents.map((document) => (
                <div className="portal-document" key={document.id}>
                  <div className="portal-document-icon">
                    <FileText size={23} />
                  </div>

                  <div className="portal-document-info">
                    <strong>{document.file_name}</strong>
                    <span>
                      {new Date(document.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    className="portal-download"
                    onClick={() => handleDownload(document)}
                    title="Download document"
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* NEW REQUEST FORM */}
        <section className="portal-section">
          <div className="portal-section-heading">
            <div>
              <h2>Submit a Request</h2>
              <p>Need help? Send a request to your service provider.</p>
            </div>
            <MessageSquare size={23} />
          </div>

          <form
            className="portal-request-form"
            onSubmit={handleSubmitRequest}
          >
            <div className="portal-form-group">
              <label>Request Title</label>
              <input
                type="text"
                placeholder="e.g. I need help with GST filing"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                maxLength={150}
                required
              />
            </div>

            <div className="portal-form-group">
              <label>Request Category</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
              >
                <option>General Query</option>
                <option>GST Filing</option>
                <option>ITR Filing</option>
                <option>Document Correction</option>
                <option>Accounting</option>
                <option>Other</option>
              </select>
            </div>

            <div className="portal-form-group">
              <label>Description</label>
              <textarea
                placeholder="Explain your request in detail..."
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                rows={4}
                maxLength={3000}
                required
              />
            </div>

            <button
              type="submit"
              className="portal-submit-request"
              disabled={submittingRequest}
            >
              <Send size={17} />
              {submittingRequest ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </section>

        {/* MY REQUESTS LIST */}
        <section className="portal-section">
          <div className="portal-section-heading">
            <div>
              <h2>My Requests</h2>
              <p>Track the status of your submitted requests.</p>
            </div>
            <span className="portal-request-count">
              {requests.length} Requests
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="portal-empty">
              You have not submitted any requests yet.
            </div>
          ) : (
            <div className="portal-requests-list">
              {requests.map((request) => (
                <div className="portal-request-card" key={request.id}>
                  <div className="portal-request-card-top">
                    <div>
                      <span className="portal-request-type">
                        {request.request_type}
                      </span>
                      <h3>{request.title}</h3>
                    </div>

                    <span className={`portal-status ${request.status
                      .toLowerCase()
                      .replace(" ", "-")}`}>
                      {request.status}
                    </span>
                  </div>

                  <p>{request.description}</p>

                  <span className="portal-request-date">
                    Submitted: {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
