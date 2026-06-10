import {
  Clapperboard,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Share2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import HeaderNav from "../components/header";
import PostFormModal from "../components/PostFormModal";
import ShareContentModal from "../components/ShareContentModal";

export default function Reels() {
  const [searchParams] = useSearchParams();
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [activeReelId, setActiveReelId] = useState("");
  const [commentsReel, setCommentsReel] = useState(null);
  const [shareReel, setShareReel] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef(new Map());

  const loadReels = useCallback(async (nextPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      setError("");
      const response = await api.get(`/reels?page=${nextPage}&limit=12`);
      setReels((current) =>
        append ? [...current, ...(response.data.reels || [])] : response.data.reels || []
      );
      setPage(nextPage);
      setHasMore(Boolean(response.data.hasMore));
    } catch (err) {
      setError(err.response?.data?.error || "Reels could not be loaded.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  useEffect(() => {
    const reelId = searchParams.get("reel");
    if (!reelId || loading) return;
    api
      .get(`/posts/${reelId}`)
      .then((response) => {
        const sharedReel = response.data.post;
        if (sharedReel.contentType !== "reel") return;
        setReels((current) => [
          sharedReel,
          ...current.filter((reel) => reel._id !== sharedReel._id),
        ]);
      })
      .catch(() => {});
  }, [loading, searchParams]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.reelId;
          const video = videoRefs.current.get(id);
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            setActiveReelId(id);
            video.play().catch(() => {});
            const index = reels.findIndex((reel) => reel._id === id);
            if (hasMore && !loadingMore && index >= reels.length - 2) {
              loadReels(page + 1, true);
            }
          } else {
            video.pause();
          }
        });
      },
      { root, threshold: [0.25, 0.7, 0.95] }
    );

    root.querySelectorAll("[data-reel-id]").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [hasMore, loadReels, loadingMore, page, reels]);

  const toggleLove = async (reelId) => {
    try {
      const response = await api.post(`/feed/${reelId}/react`, { type: "love" });
      setReels((current) =>
        current.map((reel) =>
          reel._id === reelId
            ? {
                ...reel,
                reactions: {
                  ...reel.reactions,
                  love: response.data.reactions.love?.length || 0,
                },
                userReaction: response.data.userReaction,
              }
            : reel
        )
      );
    } catch {
      // The persistent page error state is reserved for feed-loading failures.
    }
  };

  const updateComments = (reelId, comments) => {
    setReels((current) =>
      current.map((reel) => (reel._id === reelId ? { ...reel, comments } : reel))
    );
    setCommentsReel((current) =>
      current?._id === reelId ? { ...current, comments } : current
    );
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-white">
      <Toaster position="top-center" />
      <HeaderNav />

      <main className="relative">
        <div className="pointer-events-none absolute left-4 top-4 z-20 hidden md:block">
          <p className="text-xs font-bold uppercase text-white/60">Discover</p>
          <h1 className="mt-1 text-xl font-bold">Reels</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="absolute right-4 top-4 z-20 hidden min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-black md:flex"
        >
          <Plus className="h-4 w-4" />
          Create reel
        </button>

        <section
          ref={containerRef}
          className="h-[calc(100dvh-8rem)] snap-y snap-mandatory overflow-y-auto overscroll-contain md:h-[calc(100dvh-4rem)]"
        >
          {loading ? (
            <div className="grid h-full place-items-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          ) : error ? (
            <ReelsState
              icon={Clapperboard}
              title="Reels unavailable"
              description={error}
              action={<button onClick={() => loadReels()} className="btn-primary">Try again</button>}
            />
          ) : reels.length === 0 ? (
            <ReelsState
              icon={Clapperboard}
              title="No reels yet"
              description="Share the first vertical video with your community."
              action={
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Create reel
                </button>
              }
            />
          ) : (
            reels.map((reel) => (
              <ReelSlide
                key={reel._id}
                reel={reel}
                muted={muted}
                active={activeReelId === reel._id}
                setVideoRef={(video) => {
                  if (video) videoRefs.current.set(reel._id, video);
                  else videoRefs.current.delete(reel._id);
                }}
                onToggleMuted={() => setMuted((current) => !current)}
                onLove={() => toggleLove(reel._id)}
                onComments={() => setCommentsReel(reel)}
                onShare={() => setShareReel(reel)}
              />
            ))
          )}
          {loadingMore && (
            <div className="grid h-16 place-items-center text-xs text-white/60">
              Loading more reels...
            </div>
          )}
        </section>
      </main>

      <CommentsDrawer
        reel={commentsReel}
        onClose={() => setCommentsReel(null)}
        onUpdate={updateComments}
      />
      <ShareContentModal
        isOpen={Boolean(shareReel)}
        onClose={() => setShareReel(null)}
        post={shareReel}
      />
      <PostFormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        defaultContentType="reel"
        onSubmit={() => loadReels()}
      />
    </div>
  );
}

function ReelSlide({
  reel,
  muted,
  active,
  setVideoRef,
  onToggleMuted,
  onLove,
  onComments,
  onShare,
}) {
  const video = reel.media?.find((item) => item.type === "video");

  return (
    <article
      data-reel-id={reel._id}
      className="relative mx-auto flex h-full w-full snap-start items-center justify-center bg-black md:max-w-[560px]"
    >
      <video
        ref={setVideoRef}
        src={video?.url}
        muted={muted}
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
        className="h-full w-full object-contain"
        onClick={(event) => {
          if (event.currentTarget.paused) event.currentTarget.play().catch(() => {});
          else event.currentTarget.pause();
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/85 to-transparent" />

      <button
        onClick={onToggleMuted}
        className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      <div className="absolute bottom-5 left-4 right-20">
        <Link
          to={`/profile/${reel.user?.username}`}
          className="inline-flex items-center gap-2.5 font-bold"
        >
          <img src={reel.user?.dp || "/default.jpg"} alt="" className="avatar h-9 w-9" />
          @{reel.user?.username}
        </Link>
        {reel.caption && (
          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-white/90">
            {reel.caption}
          </p>
        )}
      </div>

      <div className="absolute bottom-5 right-3 flex flex-col items-center gap-4">
        <ReelAction
          label={reel.reactions?.love || 0}
          active={reel.userReaction === "love"}
          onClick={onLove}
          icon={<Heart className="h-6 w-6" fill={reel.userReaction === "love" ? "currentColor" : "none"} />}
        />
        <ReelAction
          label={reel.comments?.length || 0}
          onClick={onComments}
          icon={<MessageCircle className="h-6 w-6" />}
        />
        <ReelAction label="Share" onClick={onShare} icon={<Share2 className="h-6 w-6" />} />
      </div>
    </article>
  );
}

function ReelAction({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex w-14 flex-col items-center gap-1 text-white">
      <span
        className={`grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur ${
          active ? "text-[#ff4967]" : ""
        }`}
      >
        {icon}
      </span>
      <span className="max-w-full truncate text-[11px] font-bold">{label}</span>
    </button>
  );
}

function CommentsDrawer({ reel, onClose, onUpdate }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => setText(""), [reel?._id]);
  if (!reel) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const response = await api.post(`/feed/${reel._id}/comment`, { text: text.trim() });
      onUpdate(reel._id, [...(reel.comments || []), response.data.comment]);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/65 md:items-center" onClick={onClose}>
      <section
        className="flex h-[72dvh] w-full max-w-lg flex-col rounded-t-lg bg-white text-[#17181c] shadow-2xl dark:bg-[#15171b] dark:text-white md:h-[620px] md:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.08] px-4 dark:border-white/[0.09]">
          <h2 className="font-bold">Comments ({reel.comments?.length || 0})</h2>
          <button onClick={onClose} className="icon-button" title="Close comments">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {reel.comments?.length ? (
            <div className="space-y-4">
              {reel.comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <img src={comment.user?.dp || "/default.jpg"} alt="" className="avatar h-9 w-9" />
                  <div className="min-w-0">
                    <Link to={`/profile/${comment.user?.username}`} className="text-sm font-bold">
                      {comment.user?.username || "Unknown user"}
                    </Link>
                    <p className="mt-0.5 break-words text-sm text-zinc-600 dark:text-zinc-300">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-500">
              Be the first to comment.
            </div>
          )}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-black/[0.08] p-3 dark:border-white/[0.09]">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="field min-w-0 flex-1"
            placeholder="Add a comment"
          />
          <button disabled={!text.trim() || sending} className="btn-primary px-3" title="Post comment">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

function ReelsState({ icon: Icon, title, description, action }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        {Icon && <Icon className="mx-auto h-10 w-10 text-white/55" />}
        <h2 className="mt-4 text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-white/60">{description}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
