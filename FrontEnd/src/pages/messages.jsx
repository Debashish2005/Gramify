import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  ChevronLeft,
  MessageCircle,
  Search,
  Send,
  Smile,
} from "lucide-react";
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

function formatConversationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDay(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatSeen(value) {
  if (!value) return "Seen";
  const minutes = Math.floor((Date.now() - new Date(value)) / 60000);
  if (minutes < 1) return "Seen now";
  if (minutes < 60) return `Seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Seen ${hours}h ago`;
  return `Seen ${Math.floor(hours / 24)}d ago`;
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
      const response = await api.get("/conversations");
      setRecentChats(response.data);
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
      const response = await api.get("/me");
      setYourUserId(response.data.user.id);
      socket.emit("join", response.data.user.id);
      await fetchConversations();
    } catch (err) {
      console.error("Error fetching user:", err);
      setLoadError("Messages could not be loaded. Please sign in again or retry.");
      setLoadingUsers(false);
    }
  }, [fetchConversations]);

  const loadMessages = useCallback(
    async (user) => {
      try {
        setLoadError("");
        const conversationResponse = await api.get(`/conversations/${user.userId}`);
        const selected = {
          ...user,
          conversationId: conversationResponse.data._id,
        };
        setSelectedUser(selected);

        const messagesResponse = await api.get(`/messages/${conversationResponse.data._id}`);
        setMessages(messagesResponse.data);
        setSearchQuery("");
        setSearchResults([]);
        fetchConversations();
      } catch (err) {
        console.error("Error loading messages:", err);
        setLoadError("This conversation could not be loaded.");
      }
    },
    [fetchConversations]
  );

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    const passedUser = location.state;
    if (yourUserId && passedUser?.userId) {
      loadMessages({
        userId: passedUser.userId,
        name: passedUser.name,
        displayName: passedUser.displayName || passedUser.name,
        dp: passedUser.dp || "/default.jpg",
        online: false,
        lastSeen: null,
      });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [loadMessages, location.pathname, location.state, navigate, yourUserId]);

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
      const response = await api.post("/messages", {
        conversationId: selectedUser.conversationId,
        to: selectedUser.userId,
        content: input.trim(),
      });
      setMessages((current) => [...current, response.data]);
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
      const response = await api.get(
        `/search-users?query=${encodeURIComponent(query.trim())}`
      );
      setSearchResults(
        response.data.users.map((user) => ({
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
    <div className="flex h-[100dvh] overflow-hidden bg-white text-[#17181c] dark:bg-[#0c0d10] dark:text-white">
      <aside
        className={`w-full shrink-0 border-r border-black/[0.08] bg-white md:w-[380px] dark:border-white/[0.09] dark:bg-[#111317] ${
          selectedUser ? "hidden md:flex" : "flex"
        } flex-col`}
      >
        <header className="flex h-16 items-center gap-3 border-b border-black/[0.07] px-4 dark:border-white/[0.08]">
          <button
            onClick={() => navigate("/dashboard")}
            className="icon-button h-9 w-9"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black">Messages</h1>
            <p className="text-xs text-zinc-500">Your conversations</p>
          </div>
        </header>

        <div className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search people"
              className="field min-h-11 bg-[#f3f5f8] py-2 pl-9 dark:bg-[#1b1e23]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loadingUsers ? (
            <div className="space-y-2 p-1">
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton h-[68px]" />
              ))}
            </div>
          ) : loadError ? (
            <div className="px-8 py-14 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="mt-3 text-sm font-bold">Messages unavailable</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{loadError}</p>
              <button onClick={initializeUser} className="btn-secondary mt-4">
                Try again
              </button>
            </div>
          ) : conversationItems.length === 0 ? (
            <div className="px-8 py-14 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <MessageCircle className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-bold">
                {searchQuery ? "No people found" : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {searchQuery
                  ? "Try another name or username."
                  : "Search for someone to start a conversation."}
              </p>
            </div>
          ) : (
            conversationItems.map((chat) => (
              <ConversationRow
                key={chat.userId}
                chat={chat}
                active={selectedUser?.userId === chat.userId}
                onClick={() => loadMessages(chat)}
              />
            ))
          )}
        </div>
      </aside>

      <section
        className={`${selectedUser ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-[#f7f8fa] dark:bg-[#0c0d10]`}
      >
        {selectedUser ? (
          <>
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-black/[0.07] bg-white px-3 sm:px-5 dark:border-white/[0.08] dark:bg-[#111317]">
              <button
                onClick={() => setSelectedUser(null)}
                className="icon-button h-9 w-9 md:hidden"
                title="Back to conversations"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Link
                to={`/profile/${selectedUser.name}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="relative shrink-0">
                  <img
                    src={selectedUser.dp || "/default.jpg"}
                    alt=""
                    className="avatar h-10 w-10"
                  />
                  {selectedUser.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#111317]" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {selectedUser.displayName || selectedUser.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {formatPresence(selectedUser)}
                  </span>
                </span>
              </Link>
              <Link
                to={`/profile/${selectedUser.name}`}
                className="btn-ghost hidden sm:flex"
              >
                View profile
              </Link>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6">
              <div className="mx-auto max-w-3xl">
                <div className="mb-7 flex flex-col items-center text-center">
                  <img
                    src={selectedUser.dp || "/default.jpg"}
                    alt=""
                    className="avatar h-16 w-16"
                  />
                  <p className="mt-3 font-bold">
                    {selectedUser.displayName || selectedUser.name}
                  </p>
                  <p className="text-sm text-zinc-500">@{selectedUser.name}</p>
                </div>

                {messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const showDay =
                    !previous ||
                    new Date(previous.createdAt).toDateString() !==
                      new Date(message.createdAt).toDateString();
                  const isOwn = message.from === yourUserId;
                  const next = messages[index + 1];
                  const isLastInGroup =
                    !next ||
                    next.from !== message.from ||
                    new Date(next.createdAt) - new Date(message.createdAt) > 5 * 60 * 1000;

                  return (
                    <div key={message._id || index}>
                      {showDay && (
                        <div className="my-5 flex items-center gap-3">
                          <span className="h-px flex-1 bg-black/[0.07] dark:bg-white/[0.08]" />
                          <span className="text-[11px] font-semibold text-zinc-400">
                            {formatDay(message.createdAt)}
                          </span>
                          <span className="h-px flex-1 bg-black/[0.07] dark:bg-white/[0.08]" />
                        </div>
                      )}
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        compact={!isLastInGroup}
                        showSeen={index === lastOwnMessageIndex && message.isRead}
                      />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="shrink-0 border-t border-black/[0.07] bg-white p-3 sm:p-4 dark:border-white/[0.08] dark:bg-[#111317]">
              <div className="relative mx-auto max-w-3xl">
                {showEmojiPicker && (
                  <div className="absolute bottom-14 right-0 z-30 max-w-[calc(100vw-1.5rem)]">
                    <EmojiPicker
                      theme={document.documentElement.classList.contains("dark") ? "dark" : "light"}
                      onEmojiClick={(emoji) => setInput((current) => current + emoji.emoji)}
                    />
                  </div>
                )}
                <div className="flex min-h-12 items-center gap-2 rounded-full border border-black/[0.11] bg-[#f7f8fa] px-2 pl-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 dark:border-white/[0.12] dark:bg-[#1b1e23]">
                  <button
                    onClick={() => setShowEmojiPicker((open) => !open)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-black/[0.05] hover:text-blue-600 dark:hover:bg-white/[0.06]"
                    title="Add emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                    placeholder="Message..."
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-black">Your messages</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Choose a conversation from the left or search for someone new.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ConversationRow({ chat, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md p-3 text-left transition ${
        active
          ? "bg-blue-50 dark:bg-blue-950/35"
          : "hover:bg-black/[0.035] dark:hover:bg-white/[0.05]"
      }`}
    >
      <span className="relative shrink-0">
        <img src={chat.dp || "/default.jpg"} alt="" className="avatar h-12 w-12" />
        {chat.online && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#111317]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${chat.unreadCount ? "font-black" : "font-bold"}`}>
            {chat.displayName || chat.name}
          </span>
          <span className={`shrink-0 text-[11px] ${chat.unreadCount ? "font-bold text-blue-600" : "text-zinc-400"}`}>
            {formatConversationTime(chat.lastMessageTime)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-xs ${chat.unreadCount ? "font-semibold text-zinc-800 dark:text-zinc-200" : "text-zinc-500"}`}>
            {chat.lastMessage || `@${chat.name}`}
          </span>
          {chat.unreadCount > 0 && (
            <span className="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function MessageBubble({ message, isOwn, compact, showSeen }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${compact ? "mb-1" : "mb-3"}`}>
      <div
        className={`max-w-[84%] px-3.5 py-2.5 text-sm leading-5 sm:max-w-[70%] ${
          isOwn
            ? "rounded-2xl rounded-br-md bg-blue-600 text-white"
            : "rounded-2xl rounded-bl-md border border-black/[0.07] bg-white text-zinc-900 shadow-sm dark:border-white/[0.08] dark:bg-[#1b1e23] dark:text-white"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!compact && (
          <p className={`mt-1 text-right text-[10px] ${isOwn ? "text-blue-100" : "text-zinc-400"}`}>
            {time}
          </p>
        )}
      </div>
      {showSeen && (
        <span className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
          <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
          {formatSeen(message.readAt)}
        </span>
      )}
    </div>
  );
}
