import { useEffect, useState } from "react";
import api from "../api/axios";
import HeaderNav from "../components/header";
import { Link } from "react-router-dom";

export default function Notifications() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const res = await api.get("/notifications");
      setRequests(res.data.requests);
    };
    fetchRequests();
  }, []);

  const handleAccept = async (fromUserId) => {
    await api.put(`/follow-request/${fromUserId}/accept`);
    setRequests((prev) => prev.filter((r) => r.from._id !== fromUserId));
  };

  const handleReject = async (fromUserId) => {
    await api.put(`/follow-request/${fromUserId}/reject`);
    setRequests((prev) => prev.filter((r) => r.from._id !== fromUserId));
  };
  useEffect(() => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  return (
    <>
      <HeaderNav />
      <div className="min-h-screen pt-20 px-4 bg-gray-100 dark:bg-[#111827] text-gray-900 dark:text-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6">Follow Requests</h2>

          {requests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No follow requests</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.from._id}
                className="flex items-center justify-between mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md"
              >
                <Link
                  to={`/profile/${req.from.username}`}
                  className="flex items-center gap-3 hover:underline"
                >
                  <img
                    src={req.from.dp || "/default.jpg"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border dark:border-gray-600"
                  />
                  <span className="font-medium">{req.from.username}</span>
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.from._id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.from._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
