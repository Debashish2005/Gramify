import React, { useState,useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import {
  Home,
  PlusSquare,
  Bell,
  MessageSquare,
  Search,
  User,
} from "lucide-react";
import { cloneElement } from "react";
import PostFormModal from "./PostFormModal"; // adjust path if needed

// === Navigation Icon Component ===
const NavIcon = ({ icon, badgeCount = 0 }) => {
  return (
    <div className="relative group cursor-pointer">
      <div className="p-2 rounded-xl group-hover:bg-gray-100 transition duration-150 ease-in-out">
        <div className="text-2xl text-gray-600 group-hover:text-black transition">
          {icon}
        </div>
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default function HeaderNav() {
  const [user, setUser] = React.useState(null);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [loading, setLoading] = useState(false);


 
  React.useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const res = await api.get("/me"); // This endpoint should include unreadNotifications and unreadMessages
        if (isMounted) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch counts", err);
      }
    };

    fetchCounts(); // Fetch once on mount

    const interval = setInterval(fetchCounts, 15000); // Poll every 15 seconds

    return () => {
      isMounted = false;
      clearInterval(interval); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/conversations");
        const totalUnread = res.data.reduce(
          (sum, convo) => sum + (convo.unreadCount || 0),
          0
        );
        console.log(totalUnread);
        setUnreadMessages(totalUnread);
      } catch (err) {
        console.error("Failed to fetch unread messages:", err);
      }
    };

    fetchUnread(); // Initial call

    const intervalId = setInterval(fetchUnread, 10000); // Refresh every 10s

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const [activeTab, setActiveTab] = React.useState("Home");
  const location = useLocation();
  const pathname = location.pathname;
  const navItems = [
    { to: "/dashboard", icon: <Home />, label: "Home", match: "/dashboard" },
    { to: "/search", icon: <Search />, label: "Search" },
    { to: "/new-post", icon: <PlusSquare />, label: "Post" },
    { to: "/notifications", icon: <Bell />, label: "Notifications", badgeCount: unreadNotifications },
    { to: "/profile", icon: <User />, label: "Profile" },
  ];

useEffect(() => {
  const fetchRequests = async () => {
    try {
      const res = await api.get("/notifications");
      setUnreadNotifications(res.data.requests.length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  fetchRequests(); // initial fetch
  const interval = setInterval(fetchRequests, 10000); // fetch every 30 seconds

  return () => clearInterval(interval); // cleanup on unmount
}, []);

useEffect(() => {
  const delayDebounce = setTimeout(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true); // start loading

      try {
        const res = await api.get(`/search-users?query=${searchQuery}`);
        setSearchResults(res.data.users);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false); // done loading
      }
    };

    fetchUsers();
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [searchQuery]);



  return (
    <>
      {/* ===== Desktop Header ===== */}
      <div className="sticky top-0 z-40 hidden md:flex justify-between items-center shadow-md px-4 py-2 bg-white dark:bg-black">
        {/* Logo + Search */}
        <div className="flex items-center gap-4 align-baseline">
          <Link
            to="/dashboard"
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 font-[cursive]"
          >
            Gramify
          </Link>

          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <Search className="w-4 h-4" />
            </span>
<input
  type="text"
  placeholder="Search"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
/>
{loading && (
  <div className="absolute top-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 p-2 space-y-2 animate-pulse">
    {Array(3).fill(0).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        <div className="flex-1 space-y-1">
          <div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-2 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    ))}
  </div>
)}

{searchResults.length > 0 && (
  <div className="absolute top-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
    {searchResults.map((user) => (
      <Link
        key={user._id}
        to={`/profile/${user.username}`}
        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        onClick={() => {
          setSearchQuery(""); // clear search on click
          setSearchResults([]);
        }}
      >
        <img
          src={user.dp || "/default-avatar.png"}
          alt={user.username}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-sm text-gray-900 dark:text-white">{user.username}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{user.name}</div>
        </div>
      </Link>
    ))}
  </div>
)}

          </div>
        </div>

        {/* Center Icons */}
        <div className="flex items-center gap-6 md:gap-10 lg:gap-14 xl:gap-20 text-gray-700 dark:text-gray-300">
          {[
            { name: "Home", icon: <Home />, color: "from-pink-500 via-purple-500 to-teal-400", badgeCount: 0, to: "/dashboard" },
            { name: "Post", icon: <PlusSquare />, color: "from-pink-500 via-purple-500 to-teal-400", badgeCount: 0 },
            { name: "Notifications", icon: <Bell />, color: "from-pink-500 via-purple-500 to-teal-400", badgeCount: unreadNotifications, to: "/notifications" },
            { name: "Messages", icon: <MessageSquare />, color: "from-pink-500 via-purple-500 to-teal-400", badgeCount: unreadMessages, to: "/messages" },
          ].map(({ name, icon, color, badgeCount = 0, to }) => {
            const isActive = activeTab === name;

            const styledIcon = cloneElement(icon, {
              className: `w-6 h-6 transition-colors ${
                isActive ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
              }`,
              strokeWidth: isActive ? 2.4 : 1.8,
            });

            const iconContent = (
              <div className="relative p-1 rounded-md transition-all">
                {styledIcon}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1.5">
                    {badgeCount}
                  </span>
                )}
              </div>
            );

            // "Post" opens modal, others navigate
            if (name === "Post") {
              return (
                <div
                  key={name}
                  className="flex flex-col items-center space-y-1 cursor-pointer"
                  onClick={() => setIsPostModalOpen(true)}
                >
                  {iconContent}
                  {isActive && (
                    <>
                      <div className="w-6 h-1 rounded-full overflow-hidden dark:hidden">
                        <div className={`h-full bg-gradient-to-r ${color}`} />
                      </div>
                      <div className="w-6 h-1 rounded-full hidden dark:block">
                        <div className="h-full bg-white" />
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // For Home, Notifications, Messages: wrap in Link
            return (
              <Link
                key={name}
                to={to}
                className="flex flex-col items-center space-y-1 cursor-pointer"
                onClick={() => setActiveTab(name)}
              >
                {iconContent}
                {isActive && (
                  <>
                    <div className="w-6 h-1 rounded-full overflow-hidden dark:hidden">
                      <div className={`h-full bg-gradient-to-r ${color}`} />
                    </div>
                    <div className="w-6 h-1 rounded-full hidden dark:block">
                      <div className="h-full bg-white" />
                    </div>
                  </>
                )}
              </Link>
            );
          })}
        </div>
        {/* Profile Section */}
        {user && (
          <Link
            to={`/profile/${user.username}`}
            className="flex items-center gap-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition duration-150"
          >
            <img
              src={user.dp || "/default-avatar.png"} // fallback if no dp
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-semibold text-sm text-gray-800 dark:text-white">
                {user.username}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user.name}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* ===== Mobile Header ===== */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-black border-b shadow-sm">
        {/* Top Bar */}
        <div className="flex justify-between items-center px-4 py-2 border-b shadow-sm bg-white dark:bg-black dark:border-gray-700">
          <Link
            to="/dashboard"
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 font-[cursive]"
          >
            Gramify
          </Link>
          <Link to="/messages">
            <NavIcon icon={<MessageSquare />} badgeCount={unreadMessages} />
          </Link>
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 mb-0 flex justify-around items-center bg-white dark:bg-black shadow-md border-t dark:border-gray-700 py-2 z-50">
          {navItems.map(({ to, icon, badgeCount, label }) => {
            const isActive = pathname === to;
            const isProfileTab = to.startsWith("/profile");

            const isPostTab = to === "/new-post";

            const iconToRender =
              isProfileTab && user ? (
                <img
                  src={user.dp || "/default-avatar.png"}
                  alt="Profile"
                  className={`w-7 h-7 rounded-full object-cover border-2 ${
                    isActive
                      ? "border-black dark:border-white"
                      : "border-gray-400 dark:border-gray-600"
                  }`}
                />
              ) : (
                cloneElement(icon, {
                  className: `w-6 h-6 transition-colors duration-150 ease-in-out ${
                    isActive ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
                  }`,
                  strokeWidth: isActive ? 2.5 : 1.8,
                })
              );

            // === Handle POST separately ===
            if (isPostTab) {
              return (
                <button
                  key={to}
                  onClick={() => setIsPostModalOpen(true)}
                  className="relative flex flex-col items-center justify-center p-2"
                >
                  {badgeCount > 0 && (
                    <span className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full px-1.5">
                      {badgeCount}
                    </span>
                  )}
                  {iconToRender}
                </button>
              );
            }

            // === Default Link for other tabs ===
return (
  <Link
    key={to}
    to={isProfileTab && user ? `/profile/${user.username}` : to}
    className="relative flex flex-col items-center justify-center p-2"
  >
    {badgeCount > 0 && (
      <span className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full px-1.5">
        {badgeCount}
      </span>
    )}
    {iconToRender}
  </Link>
);

          })}
        </div>
      </div>
      <PostFormModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </>
  );
}