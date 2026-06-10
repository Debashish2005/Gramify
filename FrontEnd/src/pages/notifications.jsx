import { useEffect, useState } from "react";
import { Bell, Check, Heart, MessageCircle, UserCheck, UserPlus, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import HeaderNav from "../components/header";
import { EmptyState } from "../components/PageState";
import socket from "../socket";

const activityIcons = {
  reaction: Heart,
  comment: MessageCircle,
  follow_request: UserPlus,
  follow_accept: UserCheck,
};

function relativeTime(value) {
  if (!value) return "";
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value)) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function Notifications() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = async () => {
    try {
      setError("");
      const res = await api.get("/notifications");
      setRequests(res.data.requests || []);
      setNotifications(res.data.notifications || []);
      await api.patch("/notifications/read");
    } catch (err) {
      console.error("Failed to load activity", err);
      setError("Activity could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
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
      } else {
        setNotifications((current) => [notification, ...current]);
      }
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, []);

  const resolveRequest = async (request, action) => {
    try {
      await api.put(`/follow-request/${request.from._id}/${action}`);
      setRequests((current) => current.filter((item) => item._id !== request._id));
    } catch (err) {
      setError(err.response?.data?.error || "Could not update the follow request.");
    }
  };

  const hasActivity = requests.length > 0 || notifications.length > 0;

  return (
    <div className="app-bg pb-20 md:pb-0">
      <HeaderNav />
      <main className="page-wrap py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Updates</p>
              <h1 className="section-title mt-1">Activity</h1>
            </div>
            <button onClick={loadActivity} className="btn-ghost">
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="surface divide-y divide-black/[0.06] p-2 dark:divide-white/[0.08]">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3">
                  <div className="skeleton h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-3/5" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasActivity ? (
            <div className="surface divide-y divide-black/[0.07] overflow-hidden dark:divide-white/[0.08]">
              {requests.map((request) => (
                <div key={request._id} className="flex items-center gap-3 p-4">
                  <Link
                    to={`/profile/${request.from.username}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <img
                      src={request.from.dp || "/default.jpg"}
                      alt=""
                      className="avatar h-11 w-11"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm leading-5">
                        <strong>{request.from.username}</strong> wants to follow you
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {relativeTime(request.createdAt)}
                      </span>
                    </span>
                  </Link>
                  <button
                    onClick={() => resolveRequest(request, "accept")}
                    className="btn-primary min-h-9 px-3 py-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => resolveRequest(request, "reject")}
                    className="icon-button h-9 w-9"
                    title="Decline request"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {notifications.map((notification) => {
                const Icon = activityIcons[notification.type] || Bell;
                return (
                  <Link
                    key={notification._id}
                    to={`/profile/${notification.from?.username || ""}`}
                    className="flex items-center gap-3 p-4 transition hover:bg-black/[0.025] dark:hover:bg-white/[0.035]"
                  >
                    <span className="relative">
                      <img
                        src={notification.from?.dp || "/default.jpg"}
                        alt=""
                        className="avatar h-11 w-11"
                      />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#e23d58] text-white dark:border-[#15171b]">
                        <Icon className="h-3 w-3" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-5">
                        <strong>{notification.from?.username || "Someone"}</strong>{" "}
                        {notification.message}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[#e23d58]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="You are all caught up"
              description="Reactions, comments, follows, and requests will appear here."
            />
          )}
        </div>
      </main>
    </div>
  );
}
