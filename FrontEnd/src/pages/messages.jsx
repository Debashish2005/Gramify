import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Search, Send, Smile } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import api from "../api/axios";
import socket from "../socket";

function formatPresence(user) {
  if (user?.online) return "Active now";
  if (!user?.lastSeen) return "Offline";

  const minutes = Math.floor((Date.now() - new Date(user.lastSeen)) / 60000);
  if (minutes < 1) return "Active just now";
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  return `Active ${Math.floor(hours / 24)}d ago`;
}

export default function Messages() {
  const [yourUserId, setYourUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchConversations = useCallback(async () => {
    try {
      setLoadError("");
      const res = await api.get("/conversations");
      setRecentChats(res.data);
    } catch (err) {
      console.error("Failed to load chats:", err);
      setLoadError("Your conversations could not be loaded.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const initializeUser = useCallback(async () => {
    setLoadingUsers(true);
    setLoadError("");
    try {
      const res = await api.get("/me");
      setYourUserId(res.data.user.id);
      socket.emit("join", res.data.user.id);
      await fetchConversations();
    } catch (err) {
      console.error("Error fetching user:", err);
      setLoadError("Messages could not be loaded. Please sign in again or retry.");
      setLoadingUsers(false);
    }
  }, [fetchConversations]);

  const loadMessages = useCallback(async (user) => {
    try {
      const convoRes = await api.get(`/conversations/${user.userId}`);
      const selected = {
        ...user,
        conversationId: convoRes.data._id,
      };
      setSelectedUser(selected);

      const msgRes = await api.get(`/messages/${convoRes.data._id}`);
      setMessages(msgRes.data);
      setSearchQuery("");
      setSearchResults([]);
      fetchConversations();
    } catch (err) {
      console.error("Error loading messages:", err);
      setLoadError("This conversation could not be loaded.");
    }
  }, [fetchConversations]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    const passedUser = location.state;
    if (yourUserId && passedUser?.userId) {
      loadMessages({
        userId: passedUser.userId,
        name: passedUser.name,
        dp: passedUser.dp || "/default.jpg",
        online: false,
        lastSeen: null,
      });
    }
  }, [loadMessages, location.state, yourUserId]);

  useEffect(() => {
    const handleReceiveMessage = async (message) => {
      if (message.from === selectedUser?.userId) {
        setMessages((current) => [...current, message]);
        await api.get(`/messages/${message.conversationId}`);
      }
      fetchConversations();
    };

    const handleMessagesRead = ({ conversationId, readAt }) => {
      setMessages((current) =>
        current.map((message) =>
          message.conversationId === conversationId && message.from === yourUserId
            ? { ...message, isRead: true, readAt }
            : message
        )
      );
    };

    const handlePresence = ({ userId, online, lastSeen }) => {
      setRecentChats((current) =>
        current.map((chat) => (chat.userId === userId ? { ...chat, online, lastSeen } : chat))
      );
      setSelectedUser((current) =>
        current?.userId === userId ? { ...current, online, lastSeen } : current
      );
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("messages-read", handleMessagesRead);
    socket.on("presence-update", handlePresence);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("messages-read", handleMessagesRead);
      socket.off("presence-update", handlePresence);
    };
  }, [fetchConversations, selectedUser?.userId, yourUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedUser) return;

    try {
      const res = await api.post("/messages", {
        conversationId: selectedUser.conversationId,
        to: selectedUser.userId,
        content: input.trim(),
      });
      setMessages((current) => [...current, res.data]);
      setInput("");
      setShowEmojiPicker(false);
      fetchConversations();
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get(`/search-users?query=${encodeURIComponent(query)}`);
      setSearchResults(
        res.data.users.map((user) => ({
          userId: user._id,
          name: user.username,
          displayName: user.name,
          dp: user.dp || "/default.jpg",
        }))
      );
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    }
  };

  const conversationItems = searchQuery ? searchResults : recentChats;
  const lastOwnMessageIndex = messages.reduce(
    (last, message, index) => (message.from === yourUserId ? index : last),
    -1
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7f9] text-[#17181c] dark:bg-[#0c0d10] dark:text-white">
      <aside
        className={`w-full border-r border-black/[0.08] bg-white md:w-[360px] dark:border-white/[0.09] dark:bg-[#111317] ${
          selectedUser ? "hidden md:flex" : "flex"
        } flex-col`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search people"
              className="field min-h-10 bg-[#f2f3f5] py-2 pl-9 dark:bg-[#1b1e23]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loadingUsers ? (
            <div className="space-y-2 animate-pulse">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-16 rounded-md bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : loadError ? (
            <div className="p-8 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="mt-3 text-sm font-bold">Messages unavailable</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{loadError}</p>
              <button onClick={initializeUser} className="btn-secondary mt-4">
                Try again
              </button>
            </div>
          ) : conversationItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              {searchQuery ? "No people found" : "No conversations yet"}
            </div>
          ) : (
            conversationItems.map((chat) => (
              <button
                key={chat.userId}
                onClick={() => loadMessages(chat)}
                className={`flex w-full items-center gap-3 rounded-md p-3 text-left transition ${
                  selectedUser?.userId === chat.userId
                    ? "bg-[#e23d58]/10"
                    : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }`}
              >
                <div className="relative shrink-0">
                  <img src={chat.dp || "/default.jpg"} alt="" className="h-12 w-12 rounded-full object-cover" />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{chat.name}</p>
                    {chat.lastMessageTime && (
                      <span className="shrink-0 text-xs text-gray-400">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-gray-500">{chat.lastMessage || chat.displayName}</p>
                    {chat.unreadCount > 0 && (
                      <span className="min-w-5 rounded-full bg-[#e23d58] px-1.5 py-0.5 text-center text-xs font-semibold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className={`${selectedUser ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selectedUser ? (
          <>
            <header className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800 dark:bg-gray-900">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-md p-2 md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Link to={`/profile/${selectedUser.name}`} className="flex min-w-0 items-center gap-3">
                <div className="relative">
                  <img src={selectedUser.dp || "/default.jpg"} alt="" className="h-10 w-10 rounded-full object-cover" />
                  {selectedUser.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{formatPresence(selectedUser)}</p>
                </div>
              </Link>
            </header>

            <div className="flex-1 overflow-y-auto bg-[#f6f7f9] px-4 py-5 dark:bg-[#0c0d10]">
              <div className="mx-auto max-w-3xl space-y-2">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message._id || index}
                    message={message}
                    isOwn={message.from === yourUserId}
                    showSeen={index === lastOwnMessageIndex && message.isRead}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="relative mx-auto max-w-3xl">
                {showEmojiPicker && (
                  <div className="absolute bottom-14 right-0 z-30">
                    <EmojiPicker
                      theme={document.documentElement.classList.contains("dark") ? "dark" : "light"}
                      onEmojiClick={(emoji) => setInput((current) => current + emoji.emoji)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-md border border-black/[0.13] bg-white px-3 py-2 focus-within:border-[#e23d58] dark:border-white/[0.14] dark:bg-[#111317]">
                  <button
                    onClick={() => setShowEmojiPicker((open) => !open)}
                    className="rounded-full p-1 text-gray-500 hover:text-yellow-500"
                    title="Add emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                    placeholder="Write a message"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="rounded-md bg-[#e23d58] p-2 text-white hover:bg-[#ca304a] disabled:bg-gray-300 dark:disabled:bg-gray-700"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#f6f7f9] text-center dark:bg-[#0c0d10]">
            <div className="mb-4 rounded-full border border-gray-300 p-5 dark:border-gray-700">
              <MessageCircle className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-semibold">Your messages</h2>
            <p className="mt-1 text-sm text-gray-500">Choose a conversation or search for someone.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function MessageBubble({ message, isOwn, showSeen }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm md:max-w-md ${
          isOwn
            ? "rounded-br-md bg-[#e23d58] text-white"
            : "rounded-bl-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`mt-1 text-right text-[10px] ${isOwn ? "text-rose-100" : "text-gray-400"}`}>
          {time}
        </p>
      </div>
      {showSeen && <span className="mt-1 text-[11px] text-gray-500">Seen</span>}
    </div>
  );
}
