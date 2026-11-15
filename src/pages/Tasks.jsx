
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
  Bell,
  Search,
  Menu,
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import "./Dashboard.css";
import "./Tasks.css";

export default function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState("");
  const [role, setRole] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("All");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTasks() {
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
            .select("role, business_id, businesses(name)")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

        if (membershipError) throw membershipError;
        if (!membership) throw new Error("Business workspace not found.");

        setBusiness(membership.businesses?.name || "My Business");
        setRole(membership.role);
        setBusinessId(membership.business_id);

        const { data: clientData, error: clientError } =
          await supabase
            .from("clients")
            .select("id, name")
            .eq("business_id", membership.business_id)
            .order("name");

        if (clientError) throw clientError;
        setClients(clientData || []);

        await fetchTasks(membership.business_id);
      } catch (err) {
        setError(err.message || "Unable to load tasks.");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [navigate]);

  async function fetchTasks(id) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, clients(name)")
      .eq("business_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    setTasks(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function openEdit(task) {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || "",
      client_id: task.client_id || "",
      due_date: task.due_date || "",
      status: task.status,
    });
  }

  async function handleUpdateTask(e) {
    e.preventDefault();

    if (!editingTask.title.trim()) {
      alert("Please enter task title.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("tasks")
        .update({
          title: editingTask.title.trim(),
          description: editingTask.description.trim() || null,
          client_id: editingTask.client_id || null,
          due_date: editingTask.due_date || null,
          status: editingTask.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTask.id)
        .eq("business_id", businessId);

      if (error) throw error;

      await fetchTasks(businessId);
      setEditingTask(null);
      alert("Task updated successfully!");
    } catch (err) {
      alert(err.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("business_id", businessId);

      if (error) throw error;

      await fetchTasks(businessId);
      alert("Task deleted successfully!");
    } catch (err) {
      alert(err.message || "Unable to delete task.");
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="dashboard-loading">{error}</div>;
  }

  const pending = tasks.filter((task) => task.status === "Pending").length;
  const inProgress = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;
  const completed = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const today = (() => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
})();

const filteredTasks = tasks.filter((task) => {
  const search = searchTerm.toLowerCase().trim();

  const matchesSearch =
    !search ||
    task.title?.toLowerCase().includes(search) ||
    task.description?.toLowerCase().includes(search) ||
    task.clients?.name?.toLowerCase().includes(search);

  const matchesStatus =
    statusFilter === "All" || task.status === statusFilter;

  let matchesDueDate = true;

  if (dueDateFilter === "Overdue") {
    matchesDueDate =
      task.due_date &&
      task.due_date < today &&
      task.status !== "Completed";
  } else if (dueDateFilter === "Today") {
    matchesDueDate = task.due_date === today;
  } else if (dueDateFilter === "Upcoming") {
    matchesDueDate = task.due_date && task.due_date > today;
  } else if (dueDateFilter === "No Due Date") {
    matchesDueDate = !task.due_date;
  }

  return matchesSearch && matchesStatus && matchesDueDate;
});

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
          <Link to="/dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <Link to="/clients">
            <Users size={19} />
            Clients
          </Link>

          <a href="#" onClick={(e) => e.preventDefault()}>
            <UsersRound size={19} />
            Team Members
          </a>

          <Link to="/documents">
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
        </nav>

        <p className="sidebar-heading">PREFERENCES</p>

        <nav className="dashboard-nav">
          <a href="#" onClick={(e) => e.preventDefault()}>
            <Settings size={19} />
            Settings
          </a>
        </nav>

        <button className="dashboard-logout" onClick={handleLogout}>
          <LogOut size={19} />
          Sign out
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="mobile-menu">
            <Menu size={22} />
          </button>

          <div className="dashboard-search">
            <Search size={18} />
            <input
  placeholder="Search tasks..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
          </div>

          <div className="dashboard-user">
            <button className="notification-button">
              <Bell size={19} />
            </button>

            <div className="dashboard-avatar">
              {(user?.email || "U").charAt(0).toUpperCase()}
            </div>

            <div className="dashboard-user-info">
              <strong>{user?.user_metadata?.full_name || "User"}</strong>
              <small>{role}</small>
            </div>
          </div>
        </header>

        <section className="dashboard-content tasks-content">
          <div className="tasks-page-heading">
            <div>
              <p className="dashboard-date">WORKSPACE MANAGEMENT</p>
              <h1>Tasks Management</h1>
              <p>Manage and track all your business tasks.</p>
            </div>

            <button
              className="tasks-add-button"
              onClick={() => navigate("/tasks/new")}
            >
              <Plus size={19} />
              Create Task
            </button>
          </div>

          <div className="tasks-stats">
            <div className="tasks-stat-card">
              <span>Total Tasks</span>
              <h2>{tasks.length}</h2>
            </div>

            <div className="tasks-stat-card">
              <span>Pending</span>
              <h2>{pending}</h2>
            </div>

            <div className="tasks-stat-card">
              <span>In Progress</span>
              <h2>{inProgress}</h2>
            </div>

            <div className="tasks-stat-card">
              <span>Completed</span>
              <h2>{completed}</h2>
            </div>
          </div>

          <div className="tasks-table-card">
            <div className="tasks-table-heading">
  <div>
    <h3>All Tasks</h3>
    <p>Showing {filteredTasks.length} of {tasks.length} tasks</p>
  </div>

  <div className="tasks-filter-controls">
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <option value="All">All Status</option>
      <option value="Pending">Pending</option>
      <option value="In Progress">In Progress</option>
      <option value="Completed">Completed</option>
    </select>

    <select
      value={dueDateFilter}
      onChange={(e) => setDueDateFilter(e.target.value)}
    >
      <option value="All">All Due Dates</option>
      <option value="Overdue">Overdue</option>
      <option value="Today">Due Today</option>
      <option value="Upcoming">Upcoming</option>
      <option value="No Due Date">No Due Date</option>
    </select>
  </div>
</div>

            {filteredTasks.length === 0 ? (
  <div className="tasks-empty">
    <ClipboardList size={42} />

    <h3>
      {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
    </h3>

    <p>
      {tasks.length === 0
        ? "Create your first task to get started."
        : "Try changing your search or filters."}
    </p>
  </div>
            ) : (
              <div className="tasks-table-wrapper">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Client</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                          <small>{task.description || "No description"}</small>
                        </td>

                        <td>{task.clients?.name || "No client"}</td>

                        <td>{task.due_date || "Not set"}</td>

                        <td>
                          <span
                            className={`task-status ${task.status
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {task.status}
                          </span>
                        </td>

                        <td>
                          <div className="task-action-buttons">
                            <button
                              className="task-edit-button"
                              onClick={() => openEdit(task)}
                              title="Edit Task"
                            >
                              <Pencil size={16} />
                            </button>

                            {(role === "owner" || role === "admin") && (
                              <button
                                className="task-delete-button"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete Task"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {editingTask && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            <div className="task-modal-heading">
              <div>
                <h2>Edit Task</h2>
                <p>Update your task details.</p>
              </div>

              <button
                type="button"
                className="task-modal-close"
                onClick={() => setEditingTask(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTask}>
              <div className="new-task-field">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="new-task-field">
                <label>Description</label>
                <textarea
                  rows="4"
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="new-task-field">
                <label>Select Client</label>
                <select
                  value={editingTask.client_id}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      client_id: e.target.value,
                    })
                  }
                >
                  <option value="">No client selected</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="new-task-grid">
                <div className="new-task-field">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editingTask.due_date}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        due_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="new-task-field">
                  <label>Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="task-cancel-button"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tasks-add-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
