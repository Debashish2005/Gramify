import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import socket from "../socket";

export default function RightSidebar() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get("/conversations");
      setChats(res.data.slice(0, 8));
    } catch (err) {
      console.error("Failed to load dashboard chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([api.get("/me"), api.get("/conversations")])
      .then(([meRes, chatsRes]) => {
        setCurrentUserId(meRes.data.user.id);
        setChats(chatsRes.data.slice(0, 8));
        socket.emit("join", meRes.data.user.id);
      })
      .catch((err) => console.error("Failed to initialize dashboard chat", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const receiveMessage = (message) => {
      if (message.conversationId === selectedChat?.conversationId) {
        setMessages((current) => [...current, message]);
      }
      fetchChats();
    };
    const updatePresence = ({ userId, online, lastSeen }) => {
      setChats((current) =>
        current.map((chat) => (chat.userId === userId ? { ...chat, online, lastSeen } : chat))
      );
      setSelectedChat((current) =>
        current?.userId === userId ? { ...current, online, lastSeen } : current
      );
    };

    socket.on("receive-message", receiveMessage);
    socket.on("presence-update", updatePresence);
    return () => {
      socket.off("receive-message", receiveMessage);
      socket.off("presence-update", updatePresence);
    };
  }, [fetchChats, selectedChat?.conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openCompactChat = async (chat) => {
    try {
      const conversationRes = await api.get(`/conversations/${chat.userId}`);
      const conversationId = conversationRes.data._id;
      const messagesRes = await api.get(`/messages/${conversationId}`);
      setSelectedChat({ ...chat, conversationId });
      setMessages(messagesRes.data);
      fetchChats();
    } catch (err) {
      console.error("Failed to open compact chat", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;
    try {
      const res = await api.post("/messages", {
        conversationId: selectedChat.conversationId,
        to: selectedChat.userId,
        content: input.trim(),
      });
      setMessages((current) => [...current, res.data]);
      setInput("");
      fetchChats();
    } catch (err) {
      console.error("Failed to send dashboard message", err);
    }
  };

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-80 shrink-0 xl:block">
      <div className="surface flex max-h-[calc(100vh-9rem)] min-h-[420px] flex-col overflow-hidden">
        {selectedChat ? (
          <>
            <header className="flex h-14 items-center gap-2 border-b border-black/[0.07] px-3 dark:border-white/[0.08]">
              <button
                onClick={() => {
                  setSelectedChat(null);
                  setMessages([]);
                }}
                className="icon-button h-9 w-9"
                title="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <img src={selectedChat.dp || "/default.jpg"} alt="" className="avatar h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{selectedChat.name}</p>
                <p className="text-xs text-zinc-500">
                  {selectedChat.online ? "Active now" : "Offline"}
                </p>
              </div>
              <button
                onClick={() =>
                  navigate("/messages", {
                    state: {
                      userId: selectedChat.userId,
                      name: selectedChat.name,
                      displayName: selectedChat.displayName,
                      dp: selectedChat.dp,
                    },
                  })
                }
                className="icon-button h-9 w-9"
                title="Open full conversation"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto bg-[#f6f7f9] p-3 dark:bg-[#0c0d10]">
              {messages.map((message) => {
                const isOwn = message.from === currentUserId;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <p
                      className={`max-w-[82%] rounded-md px-3 py-2 text-xs leading-5 ${
                        isOwn
                          ? "bg-blue-600 text-white"
                          : "border border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#1b1e23]"
                      }`}
                    >
                      {message.messageType === "shared_post"
                        ? `Shared a ${message.sharedPost?.contentType === "reel" ? "reel" : "post"}`
                        : message.content}
                    </p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t border-black/[0.07] p-3 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                  className="field min-h-10 py-2"
                  placeholder="Message"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="icon-button bg-blue-600 text-white hover:bg-blue-700 hover:text-white disabled:opacity-40"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-black/[0.07] px-4 py-3 dark:border-white/[0.08]">
              <div>
                <h2 className="font-bold">Messages</h2>
                <p className="text-xs text-zinc-500">Recent conversations</p>
              </div>
              <button
                onClick={() => navigate("/messages")}
                className="icon-button h-9 w-9"
                title="Open messages"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="skeleton h-14" />
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <MessageCircle className="mx-auto h-7 w-7 text-zinc-400" />
                  <p className="mt-3 text-sm font-bold">No conversations yet</p>
                  <p className="mt-1 text-xs text-zinc-500">Message someone from their profile.</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.userId}
                    onClick={() => openCompactChat(chat)}
                    className="flex w-full items-center gap-3 rounded-md p-2.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <span className="relative shrink-0">
                      <img src={chat.dp || "/default.jpg"} alt="" className="avatar h-10 w-10" />
                      {chat.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#15171b]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold">{chat.name}</span>
                        {chat.unreadCount > 0 && (
                          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {chat.unreadCount}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {chat.online ? "Active now" : chat.lastMessage}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <button onClick={() => navigate("/messages")} className="btn-secondary m-3 mt-1">
              <MessageCircle className="h-4 w-4" />
              Open all messages
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
