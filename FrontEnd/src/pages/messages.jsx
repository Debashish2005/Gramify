import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Search } from "lucide-react";
import { useNavigate,Link } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import socket from "../socket";
import api from "../api/axios";
import { useLocation } from "react-router-dom";



export default function Messages() {
  const [yourUserId, setYourUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
useEffect(() => {
  const passedUser = location.state;
  if (passedUser && passedUser.userId) {
    loadMessages({
      userId: passedUser.userId,
      name: passedUser.name,
      dp: passedUser.dp || "https://via.placeholder.com/150",
    });
  }
}, [location.state]);


  useEffect(() => {
  if (yourUserId) {
    socket.emit("join", yourUserId); // 👈 Join only once
  }
}, [yourUserId]); // 👈 Only re-run when user ID is known

useEffect(() => {
  if (!yourUserId) return;

  const handleReceiveMessage = (message) => {
    // Only push if from current chat user
    if (message.from === selectedUser?.userId) {
      setMessages((prev) => [...prev, message]);
    }
  };

  socket.on("receive-message", handleReceiveMessage);

  return () => {
    socket.off("receive-message", handleReceiveMessage); // use the same reference
  };
}, [yourUserId, selectedUser?.userId]); // 👈 DO NOT depend on entire selectedUser


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me");
        setYourUserId(res.data.user.id);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);


    const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const goBack = () => {
    setSelectedUser(null);
  };

  const fetchConversations = async () => {
    try {
      setLoadingUsers(true);
const res = await api.get("/conversations");

      setRecentChats(
  res.data.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
);
setLoadingUsers(false);

    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  useEffect(() => {
    if (yourUserId) {
      fetchConversations();
    }
  }, [yourUserId]);

  const loadMessages = async (user) => {
    try {
      const convoRes = await api.get(`/conversations/${user.userId}`);
      const convo = convoRes.data;

      setSelectedUser({
        userId: user.userId,
        name: user.name,
        dp: user.dp,
        username: user.username, 
        conversationId: convo._id,
      });

      const msgRes = await api.get(`/messages/${convo._id}`);
      setMessages(msgRes.data);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const message = {
      conversationId: selectedUser.conversationId,
      from: yourUserId,
      to: selectedUser.userId,
      content: input.trim(),
    };

    try {
      const res = await api.post("/messages", message);
      setMessages((prev) => [...prev, res.data]);
      setInput("");

    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return setSearchResults([]);

    try {
      setLoadingUsers(true);
      const res = await api.get(`/search-users?query=${query}`);
      setSearchResults(res.data.users);
      setLoadingUsers(false);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      {/* Left Side - User List */}
      <div
        className={`w-full md:w-[30%] border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${
          selectedUser ? "hidden md:block" : "block"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-500"
            >
              <ArrowLeft />
            </button>
            <h2 className="text-2xl font-bold">Messages</h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-2 pb-1 relative">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="w-full pl-10 pr-3 py-2 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none"
          />
        </div>

        {/* Conversations */}
<div className="overflow-y-auto h-[calc(100vh-128px)] px-2">
  {loadingUsers ? (
    <div className="space-y-4 animate-pulse mt-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-2 bg-white dark:bg-gray-800 rounded-md shadow"
        >
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-3 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  ) : searchQuery ? (
    searchResults.map((user) => (
      <UserCard
        key={user._id}
        user={{
          userId: user._id,
          name: user.username,
          dp: user.dp || "https://via.placeholder.com/150",
        }}
        onClick={() =>
          loadMessages({
            userId: user._id,
            name: user.username,
            dp: user.dp || "https://via.placeholder.com/150",
          })
        }
      />
    ))
  ) : (
    recentChats.map((chat) => (
      <UserCard
        key={chat.userId}
        user={{
          userId: chat.userId,
          name: chat.name,
          dp: chat.dp || "https://via.placeholder.com/150",
          lastMessage: chat.lastMessage,
        }}
        onClick={() =>
          loadMessages({
            userId: chat.userId,
            name: chat.name,
            dp: chat.dp || "https://via.placeholder.com/150",
          })
        }
      />
    ))
  )}
</div>

      </div>

      {/* Right Side - Chat View */}
      {selectedUser && (
        <div className="flex flex-col w-full md:w-[70%] bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b dark:border-gray-700 dark:bg-gray-900 sticky top-0 z-10">
            <button
              onClick={goBack}
              className="block md:hidden text-gray-600 dark:text-gray-300"
            >
              <ArrowLeft />
            </button>
<Link to={`/profile/${selectedUser.name}`} className="flex justify-center items-center gap-2">
  <img
    src={selectedUser.dp}
    className="w-10 h-10 rounded-full object-cover"
    alt="dp"
  />
  <h2 className="font-semibold text-lg">{selectedUser.name}</h2>
</Link>

          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100 dark:bg-gray-950">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isOwn={msg.from === yourUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t dark:border-gray-700 relative">
            {showEmojiPicker && (
              <div className="absolute bottom-14 right-4 z-50">
                <EmojiPicker
                  theme={
                    document.documentElement.classList.contains("dark")
                      ? "dark"
                      : "light"
                  }
                  onEmojiClick={handleEmojiClick}
                />
              </div>
            )}
            <div className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="w-full border rounded-full px-4 py-2 pr-20 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Message..."
              />
              <button
                type="button"
                onClick={toggleEmojiPicker}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-yellow-500"
              >
                😊
              </button>
              <button
                onClick={sendMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-blue-500"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- User Card ---------- */
function UserCard({ user, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b dark:border-gray-700"
    >
      <img src={user.dp} className="w-12 h-12 rounded-full object-cover" alt="avatar" />
      <div className="flex-1">
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.lastMessage}</p>
      </div>
    </div>
  );
}

/* ---------- Message Bubble ---------- */
function MessageBubble({ message, isOwn }) {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      className={`max-w-[80%] md:max-w-sm px-4 py-2 rounded-2xl text-sm relative ${
        isOwn
          ? "ml-auto bg-blue-500 text-white rounded-br-none"
          : "mr-auto bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-bl-none"
      }`}
    >
      <div>{message.content}</div>
      <div className="text-[10px] text-right mt-1 text-white/70 dark:text-gray-400">{time}</div>
    </div>
  );
}
