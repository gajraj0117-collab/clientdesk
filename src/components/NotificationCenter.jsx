
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  FileText,
  Clock,
  MessageSquare,
  BellRing,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./NotificationCenter.css";

export default function NotificationCenter() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  const loadNotifications = async (uid) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Notification loading error:", error);
      return;
    }

    setNotifications(data || []);
  };

  // Load notifications and subscribe to realtime updates
  useEffect(() => {
    let channel = null;
    let cancelled = false;

    const initialize = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      await loadNotifications(user.id);

      if (cancelled) return;

      setLoading(false);

      // Create channel only once after initialization
      channel = supabase.channel(`notifications-${user.id}`);

      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (!cancelled) {
              loadNotifications(user.id);
            }
          }
        )
        .subscribe();
    };

    initialize();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  // Mark one notification as read
  const markAsRead = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Mark as read error:", error);
      return false;
    }

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );

    return true;
  };

  // Notification click navigation
  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    setOpen(false);

    const fallbackRoutes = {
      task: "/tasks",
      document: "/documents",
      deadline: "/tasks",
      client: "/clients",
      general: "/dashboard",
    };

    const target =
      item.link || fallbackRoutes[item.type] || "/dashboard";

    if (
      typeof target === "string" &&
      target.startsWith("/") &&
      !target.startsWith("//")
    ) {
      navigate(target);
    } else {
      navigate("/dashboard");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Mark all as read error:", error);
      return;
    }

    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  };

  // Delete one notification
  const deleteNotification = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete notification error:", error);
      alert("Could not delete notification.");
      return;
    }

    setNotifications((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!userId || notifications.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete all notifications?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Clear notifications error:", error);
      alert("Could not clear notifications.");
      return;
    }

    setNotifications([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case "task":
        return <ClipboardList size={19} />;
      case "document":
        return <FileText size={19} />;
      case "deadline":
        return <Clock size={19} />;
      case "client":
        return <MessageSquare size={19} />;
      default:
        return <BellRing size={19} />;
    }
  };

  const formatDate = (date) => {
    const notificationDate = new Date(date);

    return notificationDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="notification-center">
      <button
        className={`notification-bell ${open ? "active" : ""}`}
        onClick={() => {
          setOpen(!open);
          if (!open && userId) loadNotifications(userId);
        }}
        aria-label="Notifications"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="notification-backdrop"
            onClick={() => setOpen(false)}
          />

          <div className="notification-dropdown">
            <div className="notification-header">
              <div>
                <h3>Notifications</h3>
                <p>{unreadCount} unread notifications</p>
              </div>

              <button
                className="notification-clear-all"
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
                title="Clear all notifications"
              >
                Clear All
              </button>

              <button
                className="notification-mark-all"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                title="Mark all as read"
              >
                <CheckCheck size={17} />
              </button>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-empty">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={32} />
                  <strong>You're all caught up!</strong>
                  <span>No notifications yet.</span>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`notification-item ${
                      !item.is_read ? "unread" : ""
                    }`}
                    onClick={() => handleNotificationClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNotificationClick(item);
                      }
                    }}
                  >
                    <div className={`notification-icon ${item.type}`}>
                      {getIcon(item.type)}
                    </div>

                    <div className="notification-content">
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <span>{formatDate(item.created_at)}</span>
                    </div>

                    {!item.is_read && (
                      <span className="notification-unread-dot" />
                    )}

                    <button
                      className="notification-delete-btn"
                      title="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <span>Showing latest 30 notifications</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
