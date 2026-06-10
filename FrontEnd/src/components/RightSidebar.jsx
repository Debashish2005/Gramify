import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import socket from "../socket";

export default function RightSidebar() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchChats = async () => {
    try {
      const res = await api.get("/conversations");
      setChats(res.data.slice(0, 8));
    } catch (err) {
      console.error("Failed to load dashboard chats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    const refresh = () => fetchChats();
    const updatePresence = ({ userId, online, lastSeen }) => {
      setChats((current) =>
        current.map((chat) => (chat.userId === userId ? { ...chat, online, lastSeen } : chat))
      );
    };

    socket.on("receive-message", refresh);
    socket.on("presence-update", updatePresence);
    return () => {
      socket.off("receive-message", refresh);
      socket.off("presence-update", updatePresence);
    };
  }, []);

  const openChat = (chat) => {
    navigate("/messages", {
      state: {
        userId: chat.userId,
        name: chat.name,
        dp: chat.dp,
      },
    });
  };

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-80 shrink-0 xl:block">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Messages</h2>
            <p className="text-xs text-gray-500">Recent conversations</p>
          </div>
          <button
            onClick={() => navigate("/messages")}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Open messages"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-14 rounded-md bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              Start a conversation to see it here.
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.userId}
                onClick={() => openChat(chat)}
                className="flex w-full items-center gap-3 rounded-md p-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.dp || "/default.jpg"}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{chat.name}</p>
                    {chat.unreadCount > 0 && (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">{chat.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
