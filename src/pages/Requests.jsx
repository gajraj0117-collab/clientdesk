
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Search,
  Clock,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Requests.css";

export default function Requests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  async function loadRequests() {
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

      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .select("business_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

      if (membershipError) throw membershipError;

      if (!membership) {
        throw new Error("Business membership not found.");
      }

      setBusinessId(membership.business_id);

      const { data, error: requestsError } = await supabase
        .from("client_requests")
        .select(`
          id,
          title,
          request_type,
          description,
          status,
          created_at,
          client_id,
          clients (
            name,
            email
          )
        `)
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      setRequests(data || []);

    } catch (err) {
      setError(err.message || "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleStatusChange(requestId, newStatus) {
    if (!businessId) return;

    setUpdatingId(requestId);

    try {
      const { error } = await supabase
        .from("client_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("business_id", businessId);

      if (error) throw error;

      setRequests((previous) =>
        previous.map((request) =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );

    } catch (err) {
      alert(err.message || "Unable to update request status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title?.toLowerCase().includes(search.toLowerCase()) ||
      request.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      request.request_type?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const progressCount = requests.filter(
    (request) => request.status === "In Progress"
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  if (loading) {
    return (
      <div className="requests-loading">
        Loading requests...
      </div>
    );
  }

  return (
    <div className="requests-page">
      <header className="requests-header">
        <button
          className="requests-back"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <button
          className="requests-refresh"
          onClick={loadRequests}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <main className="requests-main">
        <section className="requests-title-section">
          <div>
            <span className="requests-eyebrow">
              CLIENT COMMUNICATION
            </span>
            <h1>Client Requests</h1>
            <p>Manage and track requests submitted by your clients.</p>
          </div>

          <div className="requests-title-icon">
            <MessageSquare size={28} />
          </div>
        </section>

        {error && (
          <div className="requests-error">
            {error}
            <button onClick={loadRequests}>Try Again</button>
          </div>
        )}

        <section className="requests-stats">
          <div className="requests-stat-card">
            <span>Total Requests</span>
            <strong>{requests.length}</strong>
          </div>

          <div className="requests-stat-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="requests-stat-card">
            <span>In Progress</span>
            <strong>{progressCount}</strong>
          </div>

          <div className="requests-stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </section>

        <section className="requests-content">
          <div className="requests-toolbar">
            <div>
              <h2>All Requests</h2>
              <p>Review client submissions and update their status.</p>
            </div>

            <div className="requests-filters">
              <div className="requests-search">
                <Search size={17} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="requests-empty">
              <MessageSquare size={35} />
              <h3>No requests found</h3>
              <p>Client requests will appear here when submitted.</p>
            </div>
          ) : (
            <div className="requests-list">
              {filteredRequests.map((request) => (
                <article className="request-management-card" key={request.id}>
                  <div className="request-card-top">
                    <div className="request-card-client">
                      <div className="request-client-avatar">
                        {request.clients?.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>

                      <div>
                        <strong>
                          {request.clients?.name || "Unknown Client"}
                        </strong>
                        <span>
                          {request.clients?.email || "No email"}
                        </span>
                      </div>
                    </div>

                    <span className={`portal-status ${request.status
                      .toLowerCase()
                      .replace(" ", "-")}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="request-card-details">
                    <span className="request-category">
                      {request.request_type}
                    </span>

                    <h3>{request.title}</h3>

                    <p>{request.description || "No description provided."}</p>

                    <span className="request-submitted-date">
                      <Clock size={14} />
                      Submitted:{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="request-card-footer">
                    <label>Update Status</label>

                    <select
                      value={request.status}
                      disabled={updatingId === request.id}
                      onChange={(e) =>
                        handleStatusChange(request.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    {request.status === "Completed" && (
                      <span className="request-completed-label">
                        <CheckCircle size={15} />
                        Completed
                      </span>
                    )}

                    {updatingId === request.id && (
                      <span className="request-updating">
                        Updating...
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
