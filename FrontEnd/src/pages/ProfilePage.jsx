import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Settings, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import Header from "../components/header";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import EditProfileForm from "../components/EditProfileForm";


export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const settingsRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [followStatus, setFollowStatus] = useState("none");
  const [currentPostIndex, setCurrentPostIndex] = useState(null);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

useEffect(() => {
  const fetchData = async () => {
    try {
      const meRes = await api.get("/me");
      const currentUser = meRes.data.user;
      setCurrentUser(currentUser);

      const profileRes = await api.get(`/profile/${username}`);
      const profileUser = profileRes.data.user;
      setProfileUser(profileUser);

      const isMe = currentUser.username === profileUser.username;
      setIsCurrentUser(isMe);
      setFollowStatus(profileUser.followStatus);

      if (isMe) {
        const postsRes = await api.get("/my-posts");
        setFeedPosts(postsRes.data.posts);
        setPostCount(postsRes.data.posts.length);
      } else {
        try {
          const postsRes = await api.get(`/user-posts/${username}`);
          setPostCount(postsRes.data.postCount);
          setFeedPosts(postsRes.data.posts || []);
        } catch (err) {
          // If 403, we still want to extract postCount from error response
          if (err.response && err.response.status === 403) {
            setPostCount(err.response.data.postCount || 0);
            setFeedPosts([]); // Can't see posts, so empty
          } else {
            throw err; // For any other error
          }
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  fetchData();
}, [username]);



  const handleFollow = async () => {
    try {
      await api.post(`/follow-request/${profileUser._id}`);
      setFollowStatus("requested");
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.post(`/unfollow/${profileUser._id}`);
      setFollowStatus("none");
    } catch (err) {
      console.error("Unfollow error:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

if (!profileUser) {
  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 text-black dark:text-white">
      <div className="flex gap-6 items-start animate-pulse">
        <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-700" />
        <div className="flex-1 space-y-4">
          <div className="h-5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="flex gap-4 text-sm">
            <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8 animate-pulse">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="w-full aspect-square bg-gray-300 dark:bg-gray-700 rounded-md"
            />
          ))}
      </div>
    </div>
  );
}





  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <Header />

        <div className="p-4 flex flex-row items-start gap-6 relative">
          <img
            src={profileUser.dp || "/profile.jpg"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">{profileUser.username}</h2>

              {isCurrentUser && (
                <div ref={settingsRef} className="relative">
                  <button onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="w-5 h-5" />
                  </button>

                  {showSettings && (
                <div className="absolute top-8 right-0 w-60 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-xl p-4 z-10 text-sm">
  {/* Theme Toggle */}
  <div className="flex items-center justify-between mb-4">
    <span className="font-medium text-gray-700 dark:text-gray-200">
      Theme: {darkMode ? "Dark" : "Light"}
    </span>
<button
  onClick={toggleTheme}
  className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors duration-300"
>
  <div
    className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${
      darkMode
        ? "translate-x-6 bg-gray-100"
        : "translate-x-1 bg-white"
    }`}
  />
</button>

  </div>

  {/* Divider */}
  <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>

  {/* Logout */}
  <button
    onClick={handleLogout}
    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-600 transition-colors"
  >
    <LogOut className="w-5 h-5" />
    <span>Logout</span>
  </button>
</div>

                  )}
                </div>
              )}
            </div>

            <h1 className="mt-2 text-xl font-semibold">{profileUser.name}</h1>

            <div className="mt-2 flex gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-2">
  {isCurrentUser ? (
    <button
      onClick={() => setShowEditForm(true)}
      className="px-4 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      Edit Profile
    </button>
  ) : (
    <>
      {followStatus === "following" ? (
        <>
          {/* Row for [Following] and [Message] on all screen sizes */}
          <div className="flex gap-2">
            <button
              className="px-4 py-1 text-sm rounded-md border bg-gray-300 text-black dark:bg-gray-700 dark:text-white cursor-default"
              disabled
            >
              Following
            </button>

{profileUser && (
  <button
    onClick={() =>
      navigate("/messages", {
        state: {
          userId: profileUser._id,
          name: profileUser.username,
          dp: profileUser.dp,
        },
      })
    }
    className="px-4 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
  >
    Message
  </button>
)}

          </div>

          {/* Unfollow always below on mobile, right on desktop */}
          <div className="mt-2 sm:mt-0 sm:ml-2">
            <button
              onClick={handleUnfollow}
              className="px-4 py-1 text-sm border rounded-md text-red-600 hover:bg-red-600 hover:text-white transition"
            >
              Unfollow
            </button>
          </div>
        </>
      ) : followStatus === "requested" ? (
        <button
          className="px-4 py-1 text-sm border rounded-md bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800"
          disabled
        >
          Requested
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleFollow}
            className="px-4 py-1 text-sm border rounded-md hover:bg-blue-500 hover:text-white"
          >
            Follow
          </button>
          <button
    onClick={() =>
      navigate("/messages", {
        state: {
          userId: profileUser._id,
          name: profileUser.username,
          dp: profileUser.dp,
        },
      })
    }
    className="px-4 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
  >
    Message
  </button>
        </div>
      )}
    </>
  )}
</div>
 </div>

            <p className="mt-1 text-sm">{profileUser.bio}</p>

            <div className="flex gap-4 text-sm mt-2">
              <span>
                <strong>{postCount}</strong> posts
              </span>
              <span>
                <strong>{profileUser.followers.length}</strong> followers
              </span>
              <span>
                <strong>{profileUser.following.length}</strong> following
              </span>
            </div>
          </div>
        </div>

        {(isCurrentUser || followStatus === "following") ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {feedPosts.map((post, index) => {
              const media = post.media[0];
              return (
                <div
                  key={post._id}
                  onClick={() => setCurrentPostIndex(index)}
                  className="w-full aspect-square rounded-md overflow-hidden cursor-pointer"
                >
                  {media?.type === "video" ? (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      loop
                    />
                  ) : (
                    <img
                      src={media?.url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 mt-8">
            This account is private. Follow to see their posts.
          </div>
        )}

        {currentPostIndex !== null && feedPosts[currentPostIndex] && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center px-4">
            <div className="relative bg-white dark:bg-gray-900 rounded-md p-4 max-w-3xl w-full flex items-center justify-center">
              <button
                onClick={() => setCurrentPostIndex(null)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  setCurrentPostIndex((prev) => (prev > 0 ? prev - 1 : prev))
                }
                disabled={currentPostIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200 p-2 rounded-full disabled:opacity-50"
              >
                <ChevronLeft />
              </button>

              <div className="w-full">
                <PostCard post={feedPosts[currentPostIndex]} />
              </div>

              <button
                onClick={() =>
                  setCurrentPostIndex((prev) =>
                    prev < feedPosts.length - 1 ? prev + 1 : prev
                  )
                }
                disabled={currentPostIndex === feedPosts.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 p-2 rounded-full disabled:opacity-50"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}

        {showEditForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl w-full max-w-lg relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                onClick={() => setShowEditForm(false)}
              >
                ×
              </button>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Edit Profile</h2>
              <EditProfileForm
                userData={profileUser}
                onUpdate={(updatedUser) => {
                  setProfileUser(updatedUser);
                  setShowEditForm(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
