import { useEffect, useState } from "react";
import { Bell, Heart, Home, MessageCircle, Plus, Search, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import socket from "../socket";
import Brand from "./Brand";
import PostFormModal from "./PostFormModal";

function Badge({ count, tone = "activity" }) {
  if (!count) return null;
  return (
    <span
      className={`absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold leading-4 text-white ${
        tone === "messages" ? "bg-blue-600" : "bg-[#e23d58]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItem({ to, icon, label, active, badgeCount = 0, badgeTone, onClick }) {
  const IconComponent = icon;
  const content = (
    <>
      <span className="relative">
        <IconComponent className="h-5 w-5" strokeWidth={active ? 2.5 : 1.9} />
        <Badge count={badgeCount} tone={badgeTone} />
      </span>
      <span className="hidden lg:block">{label}</span>
      <span
        className={`absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-[#e23d58] transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );

  const className = `relative flex h-10 min-w-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
    active
      ? "text-[#17181c] dark:text-white"
      : "text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} title={label}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={className} title={label}>
      {content}
    </Link>
  );
}

export default function HeaderNav() {
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { pathname } = useLocation();

  const refreshCounts = async () => {
    try {
      const [meRes, activityRes, conversationsRes] = await Promise.all([
        api.get("/me"),
        api.get("/notifications"),
        api.get("/conversations"),
      ]);

      setUser(meRes.data.user);
      setUnreadNotifications(activityRes.data.unreadCount || 0);
      setUnreadMessages(
        conversationsRes.data.reduce(
          (total, conversation) => total + (conversation.unreadCount || 0),
          0
        )
      );
      socket.emit("join", meRes.data.user.id);
    } catch (err) {
      console.error("Failed to load navigation state", err);
    }
  };

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNotification = () => {
      setUnreadNotifications((count) => count + 1);
    };
    const handleMessage = () => {
      setUnreadMessages((count) => count + 1);
    };

    socket.on("notification", handleNotification);
    socket.on("receive-message", handleMessage);
    return () => {
      socket.off("notification", handleNotification);
      socket.off("receive-message", handleMessage);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const res = await api.get(
          `/search-users?query=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchResults(res.data.users || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const profilePath = user ? `/profile/${user.username}` : "/profile";
  const desktopItems = [
    { to: "/dashboard", label: "Home", icon: Home, active: pathname === "/dashboard" },
    {
      to: "/notifications",
      label: "Activity",
      icon: Bell,
      active: pathname === "/notifications",
      badgeCount: unreadNotifications,
    },
    {
      to: "/messages",
      label: "Messages",
      icon: MessageCircle,
      active: pathname === "/messages",
      badgeCount: unreadMessages,
      badgeTone: "messages",
    },
  ];

  const mobileItems = [
    ...desktopItems.slice(0, 1),
    { to: "/search", label: "Search", icon: Search, active: pathname === "/search" },
    { label: "Create", icon: Plus, onClick: () => setIsPostModalOpen(true) },
    desktopItems[2],
    {
      to: profilePath,
      label: "Profile",
      icon: UserRound,
      active: pathname.startsWith("/profile/"),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/95 backdrop-blur dark:border-white/[0.09] dark:bg-[#111317]/95">
        <div className="page-wrap flex h-16 items-center gap-5">
          <Brand compact />

          <div className="relative hidden w-full max-w-xs md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="field h-10 min-h-10 bg-[#f4f5f7] pl-9 dark:bg-[#1b1e23]"
              placeholder="Search people"
              aria-label="Search people"
            />
            {(searching || searchResults.length > 0) && (
              <div className="surface absolute left-0 right-0 top-12 overflow-hidden p-1 shadow-xl">
                {searching ? (
                  <div className="space-y-1 p-2">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="flex items-center gap-3 p-2">
                        <div className="skeleton h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-3 w-24" />
                          <div className="skeleton h-2.5 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <Link
                      key={result._id}
                      to={`/profile/${result.username}`}
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-3 rounded-md p-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      <img
                        src={result.dp || "/default-avatar.png"}
                        alt=""
                        className="avatar h-9 w-9"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {result.username}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {result.name}
                        </span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <nav className="ml-auto hidden h-full items-center gap-1 md:flex">
            {desktopItems.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
            <NavItem
              label="Create"
              icon={Plus}
              onClick={() => setIsPostModalOpen(true)}
            />
          </nav>

          {user && (
            <Link
              to={profilePath}
              className={`hidden h-10 items-center gap-2 rounded-md p-1.5 pr-3 transition md:flex ${
                pathname.startsWith("/profile/")
                  ? "bg-[#e23d58]/10"
                  : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              }`}
            >
              <img
                src={user.dp || "/default-avatar.png"}
                alt=""
                className="avatar h-7 w-7"
              />
              <span className="hidden max-w-24 truncate text-sm font-semibold xl:block">
                {user.username}
              </span>
            </Link>
          )}

          <Link
            to="/notifications"
            className={`relative ml-auto grid h-10 w-10 place-items-center rounded-md md:hidden ${
              pathname === "/notifications" ? "text-[#e23d58]" : ""
            }`}
            aria-label="Activity"
          >
            <Heart
              className="h-6 w-6"
              fill={pathname === "/notifications" ? "currentColor" : "none"}
            />
            <Badge count={unreadNotifications} />
          </Link>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-black/[0.08] bg-white px-1 pb-[env(safe-area-inset-bottom)] dark:border-white/[0.09] dark:bg-[#111317] md:hidden">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const className = `relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
            item.active ? "text-[#e23d58]" : "text-zinc-500 dark:text-zinc-400"
          }`;
          const content = (
            <>
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={item.active ? 2.6 : 2} />
                <Badge count={item.badgeCount} tone={item.badgeTone} />
              </span>
              <span className="truncate">{item.label}</span>
            </>
          );

          return item.onClick ? (
            <button key={item.label} onClick={item.onClick} className={className}>
              {content}
            </button>
          ) : (
            <Link key={item.label} to={item.to} className={className}>
              {content}
            </Link>
          );
        })}
      </nav>

      <PostFormModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </>
  );
}
