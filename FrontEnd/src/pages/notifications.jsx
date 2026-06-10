import { useEffect, useState } from "react";
import { Bell, Check, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import HeaderNav from "../components/header";
import socket from "../socket";

const activityIcons = {
  reaction: Heart,
  comment: MessageCircle,
  follow_request: UserPlus,
  follow_accept: Check,
};

function relativeTime(value) {
  if (!value) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get("/notifications");
        setRequests(res.data.requests || []);
        setNotifications(res.data.notifications || []);
        await api.patch("/notifications/read");
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  useEffect(() => {
    const handleNotification = (notification) => {
      if (notification.type === "follow_request") {
        setRequests((current) => [
          {
            _id: notification._id,
            from: notification.from,
            createdAt: notification.createdAt,
            status: "pending",
          },
          ...current.filter((request) => request.from._id !== notification.from._id),
        ]);
        return;
      }
      setNotifications((current) => [notification, ...current]);
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, []);

  const handleAccept = async (fromUserId) => {
    await api.put(`/follow-request/${fromUserId}/accept`);
    setRequests((current) => current.filter((request) => request.from._id !== fromUserId));
  };

  const handleReject = async (fromUserId) => {
    await api.put(`/follow-request/${fromUserId}/reject`);
    setRequests((current) => current.filter((request) => request.from._id !== fromUserId));
  };

  return (
    <>
      <HeaderNav />
      <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Activity</h1>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-lg bg-white dark:bg-gray-900" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800"
                >
                  <Link to={`/profile/${request.from.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <img
                      src={request.from.dp || "/default.jpg"}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        <strong>{request.from.username}</strong> sent you a follow request
                      </p>
                      <p className="text-xs text-gray-500">{relativeTime(request.createdAt)}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleAccept(request.from._id)}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request.from._id)}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Reject request"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}

              {notifications.map((notification) => {
                const Icon = activityIcons[notification.type] || Bell;
                return (
                  <Link
                    key={notification._id}
                    to={`/profile/${notification.from?.username || ""}`}
                    className="flex items-center gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                  >
                    <div className="relative">
                      <img
                        src={notification.from?.dp || "/default.jpg"}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow dark:bg-gray-900">
                        <Icon className="h-3.5 w-3.5 text-blue-600" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <strong>{notification.from?.username || "Someone"}</strong>{" "}
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{relativeTime(notification.createdAt)}</p>
                    </div>
                    {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                  </Link>
                );
              })}

              {requests.length === 0 && notifications.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Bell className="mx-auto mb-3 h-8 w-8" />
                  <p>No activity yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
