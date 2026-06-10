import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock3,
  Grid3X3,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Sun,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { clearAuthToken } from "../api/axios";
import EditProfileForm from "../components/EditProfileForm";
import HeaderNav from "../components/header";
import { EmptyState } from "../components/PageState";
import PostCard from "../components/PostCard";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const settingsRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [followStatus, setFollowStatus] = useState("none");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setProfileUser(null);
    try {
      const [meRes, profileRes] = await Promise.all([
        api.get("/me"),
        api.get(`/profile/${username}`),
      ]);
      const me = meRes.data.user;
      const profile = profileRes.data.user;
      const isMe = me.username === profile.username;

      setCurrentUser(me);
      setProfileUser(profile);
      setFollowStatus(profile.followStatus || "none");

      const postsRes = isMe
        ? await api.get("/my-posts")
        : await api.get(`/user-posts/${username}`);
      setPosts(postsRes.data.posts || []);
      setPostCount(postsRes.data.postCount ?? postsRes.data.posts?.length ?? 0);
    } catch (err) {
      console.error("Failed to load profile", err);
      setError(
        err.response?.status === 404
          ? "This profile does not exist."
          : "This profile could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const postId = location.state?.postId;
    if (!postId || posts.length === 0) return;

    const relatedPost = posts.find((post) => post._id === postId);
    if (relatedPost) setSelectedPost(relatedPost);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, posts]);

  useEffect(() => {
    const closeSettings = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", closeSettings);
    return () => document.removeEventListener("mousedown", closeSettings);
  }, []);

  const isCurrentUser = currentUser?.username === profileUser?.username;

  const updateFollow = async (action) => {
    if (!profileUser || actionLoading) return;
    setActionLoading(true);
    try {
      if (action === "follow") {
        await api.post(`/follow-request/${profileUser._id}`);
      } else {
        await api.post(`/unfollow/${profileUser._id}`);
      }
    } catch (err) {
      const knownStateError = ["Already following", "Follow request already sent"].includes(
        err.response?.data?.error
      );
      if (!knownStateError) toast.error(err.response?.data?.error || "Could not update follow status");
    } finally {
      await loadProfile();
      setActionLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      clearAuthToken();
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="app-bg">
        <HeaderNav />
        <main className="page-wrap py-8">
          <div className="surface mx-auto max-w-4xl p-6">
            <div className="flex items-center gap-5">
              <div className="skeleton h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-4 w-52" />
                <div className="skeleton h-4 w-64" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="app-bg pb-20 md:pb-0">
        <HeaderNav />
        <main className="page-wrap py-8">
          <div className="mx-auto max-w-3xl">
            <EmptyState
              icon={UserRound}
              title="Profile unavailable"
              description={error || "This profile could not be loaded."}
              action={
                <button onClick={() => navigate("/dashboard")} className="btn-primary">
                  Back to home
                </button>
              }
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-bg pb-20 md:pb-0">
      <HeaderNav />
      <main className="page-wrap py-6 sm:py-8">
        <section className="surface mx-auto max-w-5xl overflow-visible">
          <div className="h-28 overflow-hidden bg-[#20242c] sm:h-40">
            {profileUser.banner && (
              <img
                src={profileUser.banner}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="px-4 pb-6 sm:px-7">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
              <img
                src={profileUser.dp || "/default-avatar.png"}
                alt=""
                className="avatar h-24 w-24 border-4 border-white shadow-sm dark:border-[#15171b] sm:h-28 sm:w-28"
              />
              <div className="min-w-0 flex-1 sm:pb-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-black">{profileUser.name}</h1>
                    <p className="text-sm text-zinc-500">@{profileUser.username}</p>
                  </div>

                  {isCurrentUser ? (
                    <div className="relative flex gap-2" ref={settingsRef}>
                      <button onClick={() => setShowEditForm(true)} className="btn-secondary">
                        Edit profile
                      </button>
                      <button
                        onClick={() => setShowSettings((open) => !open)}
                        className="icon-button border border-black/[0.12] dark:border-white/[0.14]"
                        title="Profile settings"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      {showSettings && (
                        <div className="surface absolute right-0 top-12 z-20 w-56 p-1 shadow-xl">
                          <button onClick={toggleTheme} className="btn-ghost w-full justify-start">
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            {isDark ? "Use light theme" : "Use dark theme"}
                          </button>
                          <button
                            onClick={logout}
                            className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {followStatus === "following" ? (
                        <button
                          onClick={() => updateFollow("unfollow")}
                          disabled={actionLoading}
                          className="btn-secondary"
                        >
                          <UserCheck className="h-4 w-4" />
                          Following
                        </button>
                      ) : followStatus === "requested" ? (
                        <button disabled className="btn-secondary">
                          <Clock3 className="h-4 w-4" />
                          Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => updateFollow("follow")}
                          disabled={actionLoading}
                          className="btn-primary"
                        >
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </button>
                      )}
                      <button
                        onClick={() =>
                          navigate("/messages", {
                            state: {
                              userId: profileUser._id,
                              name: profileUser.username,
                              displayName: profileUser.name,
                              dp: profileUser.dp,
                            },
                          })
                        }
                        className="btn-secondary"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {profileUser.bio && (
              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {profileUser.bio}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-6 border-t border-black/[0.07] pt-5 text-sm dark:border-white/[0.08]">
              <span>
                <strong>{postCount}</strong> <span className="text-zinc-500">posts</span>
              </span>
              <span>
                <strong>{profileUser.followers?.length || 0}</strong>{" "}
                <span className="text-zinc-500">followers</span>
              </span>
              <span>
                <strong>{profileUser.following?.length || 0}</strong>{" "}
                <span className="text-zinc-500">following</span>
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-5xl">
          <div className="mb-4 flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            <h2 className="font-bold">Posts</h2>
            {!isCurrentUser && followStatus !== "following" && (
              <span className="ml-auto text-xs text-zinc-500">Showing public posts</span>
            )}
          </div>

          {posts.length ? (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {posts.map((post) => {
                const media = post.media?.[0];
                return (
                  <button
                    key={post._id}
                    onClick={() => setSelectedPost(post)}
                    className="group relative aspect-square overflow-hidden bg-zinc-200 dark:bg-zinc-800"
                    aria-label="Open post"
                  >
                    {media?.type === "video" ? (
                      <video src={media.url} muted className="h-full w-full object-cover" />
                    ) : media?.url ? (
                      <img src={media.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center p-4 text-sm text-zinc-500">
                        {post.caption || "Text post"}
                      </span>
                    )}
                    <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Grid3X3}
              title={isCurrentUser ? "No posts yet" : "No visible posts"}
              description={
                isCurrentUser
                  ? "Your posts will appear here after you publish them."
                  : "This person has not shared any posts you can view."
              }
            />
          )}
        </section>
      </main>

      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-3 py-6">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setSelectedPost(null)}
              className="icon-button fixed right-4 top-4 z-10 bg-black/60 text-white hover:bg-black/80 hover:text-white"
              title="Close post"
            >
              <X className="h-5 w-5" />
            </button>
            <PostCard
              post={selectedPost}
              onDeleted={() => {
                setSelectedPost(null);
                loadProfile();
              }}
            />
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-black/[0.08] px-4 dark:border-white/[0.09]">
              <h2 className="font-bold">Edit profile</h2>
              <button onClick={() => setShowEditForm(false)} className="icon-button" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
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
  );
}
