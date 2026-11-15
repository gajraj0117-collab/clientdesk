
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  Search,
  Menu,
  Building2,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import NotificationCenter from "../components/NotificationCenter";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalClients, setTotalClients] = useState(0);
  const [totalTeamMembers, setTotalTeamMembers] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  useEffect(() => {
    async function loadDashboard() {
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

        const { data, error: membershipError } = await supabase
          .from("memberships")
          .select("role, business_id, businesses(name)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (membershipError) throw membershipError;

        if (!data) {
          setError("No business workspace found for this account.");
          return;
        }

        setBusiness(data.businesses?.name || "My Business");
        setRole(data.role);
        const { count, error: clientsError } = await supabase
  .from("clients")
  .select("*", { count: "exact", head: true })
  .eq("business_id", data.business_id);

if (clientsError) throw clientsError;

setTotalClients(count || 0);
const { count: teamCount, error: teamError } = await supabase
  .from("memberships")
  .select("*", { count: "exact", head: true })
  .eq("business_id", data.business_id)
  .in("role", ["owner", "admin", "staff"]);

if (teamError) throw teamError;

setTotalTeamMembers(teamCount || 0);
const { count: documentCount, error: documentError } = await supabase
  .from("client_documents")
  .select("*", { count: "exact", head: true })
  .eq("business_id", data.business_id);

if (documentError) throw documentError;

setTotalDocuments(documentCount || 0);
const { count: taskCount, error: taskError } = await supabase
  .from("tasks")
  .select("*", { count: "exact", head: true })
  .eq("business_id", data.business_id)
  .eq("status", "Pending");

if (taskError) throw taskError;

setPendingTasks(taskCount || 0);
// Fetch latest client registrations
const { data: clientActivities, error: clientActivityError } =
  await supabase
    .from("clients")
    .select("id, name, created_at")
    .eq("business_id", data.business_id)
    .order("created_at", { ascending: false })
    .limit(5);

if (clientActivityError) throw clientActivityError;

// Fetch latest document uploads
const { data: documentActivities, error: documentActivityError } =
  await supabase
    .from("client_documents")
    .select("id, file_name, created_at")
    .eq("business_id", data.business_id)
    .order("created_at", { ascending: false })
    .limit(5);

if (documentActivityError) throw documentActivityError;

// Fetch latest tasks
const { data: taskActivities, error: taskActivityError } =
  await supabase
    .from("tasks")
    .select("id, title, status, created_at")
    .eq("business_id", data.business_id)
    .order("created_at", { ascending: false })
    .limit(5);

if (taskActivityError) throw taskActivityError;

// Fetch latest client requests
const { data: requestActivities, error: requestActivityError } =
  await supabase
    .from("client_requests")
    .select("id, title, status, created_at")
    .eq("business_id", data.business_id)
    .order("created_at", { ascending: false })
    .limit(5);

if (requestActivityError) throw requestActivityError;

// Combine all activities
const combinedActivities = [
  ...(clientActivities || []).map((item) => ({
    id: `client-${item.id}`,
    title: "New client added",
    detail: item.name,
    type: "Client",
    created_at: item.created_at,
  })),

  ...(documentActivities || []).map((item) => ({
    id: `document-${item.id}`,
    title: "Document uploaded",
    detail: item.file_name,
    type: "Document",
    created_at: item.created_at,
  })),

  ...(taskActivities || []).map((item) => ({
    id: `task-${item.id}`,
    title: "Task created",
    detail: `${item.title} • ${item.status}`,
    type: "Task",
    created_at: item.created_at,
  })),

  ...(requestActivities || []).map((item) => ({
    id: `request-${item.id}`,
    title: "Client request submitted",
    detail: `${item.title} • ${item.status}`,
    type: "Request",
    created_at: item.created_at,
  })),
];

combinedActivities.sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);

setRecentActivities(combinedActivities.slice(0, 8));
      } catch (err) {
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/login");
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading your workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        <p>{error}</p>
        <button onClick={handleLogout}>Sign out</button>
      </div>
    );
  }

  const stats = [
    { title: "Total Clients", value: totalClients, icon: Users, color: "blue" },
    { title: "Team Members", value: totalTeamMembers, icon: UsersRound, color: "purple" },
    { title: "Documents", value: totalDocuments, icon: FileText, color: "orange" },
    { title: "Pending Tasks", value: pendingTasks, icon: ClipboardList, color: "green" },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-icon">C</span>
          <span>Client<span>Desk</span></span>
        </div>

        <div className="sidebar-workspace">
          <Building2 size={19} />
          <div>
            <strong>{business}</strong>
            <small>Business workspace</small>
          </div>
        </div>

        <p className="sidebar-heading">WORKSPACE</p>

        <nav className="dashboard-nav">
          <Link
            to="/dashboard"
            className={location.pathname === "/dashboard" ? "active" : ""}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <Link
            to="/clients"
            className={location.pathname === "/clients" ? "active" : ""}
          >
            <Users size={19} />
            Clients
          </Link>

          <Link to="/team-members">
            <UsersRound size={19} />
            Team Members
          </Link>

          <Link
            to="/documents"
            className={location.pathname === "/documents" ? "active" : ""}
          >
            <FileText size={19} />
            Documents
          </Link>

          <Link
            to="/tasks"
            className={location.pathname === "/tasks" ? "active" : ""}
          >
            <ClipboardList size={19} />
            Tasks
          </Link>
          <Link
  to="/requests"
  className={location.pathname === "/requests" ? "active" : ""}
>
  <MessageSquare size={19} />
  Client Requests
</Link>

<Link
  to="/subscription"
  className={location.pathname === "/subscription" ? "active" : ""}
>
  <CreditCard size={19} />
  Subscription
</Link>
        </nav>

        <p className="sidebar-heading">PREFERENCES</p>

        <nav className="dashboard-nav">
          <Link
  to="/settings"
  className={location.pathname === "/settings" ? "active" : ""}
>
  <Settings size={19} />
  Settings
</Link>
        </nav>

        
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="mobile-menu">
            <Menu size={22} />
          </button>

          <div className="dashboard-search">
            <Search size={18} />
            <input placeholder="Search anything..." />
          </div>

          <div className="dashboard-user">
  <NotificationCenter />

  <button
    className="topbar-logout"
    onClick={handleLogout}
    title="Sign Out"
  >
    <LogOut size={18} />
    <span>Sign Out</span>
  </button>

            <div className="dashboard-avatar">
              {(user?.user_metadata?.full_name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="dashboard-user-info">
              <strong>
                {user?.user_metadata?.full_name || "User"}
              </strong>
              <small>{role}</small>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <p className="dashboard-date">BUSINESS OVERVIEW</p>
              <h1>Welcome back, {user?.user_metadata?.full_name || "User"}!</h1>
              <p>Here is what's happening in your workspace today.</p>
            </div>

            <div className="dashboard-business-badge">
              <Building2 size={18} />
              {business}
            </div>
          </div>

          <div className="dashboard-stats">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div className="dashboard-stat-card" key={item.title}>
                  <div className={`stat-icon ${item.color}`}>
                    <Icon size={22} />
                  </div>
                  <p>{item.title}</p>
                  <h2>{item.value}</h2>
                  <small>Ready to get started</small>
                </div>
              );
            })}
          </div>

          <div className="dashboard-lower">
            <div className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Activity</h3>
                  <p>Your latest workspace updates</p>
                </div>
              </div>

              {recentActivities.length === 0 ? (
  <div className="dashboard-empty">
    <ClipboardList size={35} />
    <h3>No activity yet</h3>
    <p>Your recent business activity will appear here.</p>
  </div>
) : (
  <div className="recent-activity-list">
    {recentActivities.map((activity) => (
      <div className="recent-activity-item" key={activity.id}>
        <div className="activity-dot"></div>

        <div className="activity-info">
          <strong>{activity.title}</strong>
          <p>{activity.detail}</p>
          <small>
            {new Date(activity.created_at).toLocaleString("en-IN")}
          </small>
        </div>

        <span className="activity-type">{activity.type}</span>
      </div>
    ))}
  </div>
)}
            </div>

            <div className="dashboard-panel quick-panel">
              <h3>Quick Overview</h3>
              <p>Your workspace is ready.</p>

              <div className="quick-item">
                <span>Workspace</span>
                <strong>{business}</strong>
              </div>

              <div className="quick-item">
                <span>Your role</span>
                <strong>{role}</strong>
              </div>

              <div className="quick-item">
                <span>Account</span>
                <strong className="account-active">Active</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
