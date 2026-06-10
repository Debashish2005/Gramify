import { useEffect, useRef, useState } from "react";
import {
  Angry,
  Frown,
  Heart,
  Laugh,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  Share2,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ConfirmModal from "./ConfirmModal";
import PostFormModal from "./PostFormModal";
import ShareContentModal from "./ShareContentModal";

const reactionOptions = [
  { type: "like", label: "Like", Icon: ThumbsUp, color: "text-blue-600" },
  { type: "love", label: "Love", Icon: Heart, color: "text-rose-600" },
  { type: "smile", label: "Smile", Icon: Laugh, color: "text-amber-500" },
  { type: "sad", label: "Sad", Icon: Frown, color: "text-sky-500" },
  { type: "angry", label: "Angry", Icon: Angry, color: "text-red-700" },
];

function relativeTime(value) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function PostMedia({ media = [] }) {
  if (!media.length) return null;

  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="border-y border-black/[0.06] bg-black/[0.02] dark:border-white/[0.08] dark:bg-black/20">
        {item.type === "video" ? (
          <video controls src={item.url} className="max-h-[680px] w-full object-contain" />
        ) : (
          <img src={item.url} alt="Post media" className="max-h-[680px] w-full object-contain" />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 overflow-hidden border-y border-black/[0.06] dark:border-white/[0.08]">
      {media.slice(0, 6).map((item, index) => (
        <div key={`${item.url}-${index}`} className="relative aspect-square bg-black/[0.03]">
          {item.type === "video" ? (
            <video src={item.url} controls className="h-full w-full object-cover" />
          ) : (
            <img src={item.url} alt="" className="h-full w-full object-cover" />
          )}
          {index === 5 && media.length > 6 && (
            <span className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-bold text-white">
              +{media.length - 6}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PostCard({ post, onDeleted }) {
  const [postData, setPostData] = useState(post);
  const [currentUser, setCurrentUser] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionList, setShowReactionList] = useState(false);
  const [reactionUsers, setReactionUsers] = useState({});
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setPostData(post), [post]);

  useEffect(() => {
    api
      .get("/me")
      .then((res) => setCurrentUser(res.data.user))
      .catch((err) => console.error("Failed to load current user", err));
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const totalReactions = Object.values(postData.reactions || {}).reduce(
    (total, count) => total + Number(count || 0),
    0
  );
  const selectedReaction = reactionOptions.find(
    (reaction) => reaction.type === postData.userReaction
  );
  const SelectedReactionIcon = selectedReaction?.Icon;
  const activeReactionTypes = reactionOptions.filter(
    (reaction) => (postData.reactions?.[reaction.type] || 0) > 0
  );
  const isOwner = currentUser?.id === postData.user?._id;

  const react = async (type) => {
    setShowReactionPicker(false);
    try {
      const res = await api.post(`/feed/${postData._id}/react`, { type });
      setPostData((current) => ({
        ...current,
        reactions: Object.fromEntries(
          Object.entries(res.data.reactions).map(([key, users]) => [key, users.length])
        ),
        userReaction: res.data.userReaction,
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not update your reaction");
    }
  };

  const openReactionList = async () => {
    if (!totalReactions) return;
    setShowReactionList(true);
    setLoadingReactions(true);
    try {
      const res = await api.get(`/feed/${postData._id}/reactions`);
      setReactionUsers(res.data.reactions || {});
    } catch {
      toast.error("Could not load reactions");
    } finally {
      setLoadingReactions(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await api.post(`/feed/${postData._id}/comment`, {
        text: newComment.trim(),
      });
      setPostData((current) => ({
        ...current,
        comments: [...(current.comments || []), res.data.comment],
      }));
      setNewComment("");
      setShowComments(true);
    } catch {
      toast.error("Could not add your comment");
    } finally {
      setCommenting(false);
    }
  };

  const deletePost = async () => {
    try {
      await api.delete(`/post/${postData._id}`);
      setShowDeleteModal(false);
      onDeleted?.(postData._id);
      toast.success("Post deleted");
    } catch {
      toast.error("Could not delete the post");
    }
  };

  return (
    <article className="surface overflow-visible">
      <header className="flex items-center gap-3 p-4">
        <Link to={`/profile/${postData.user?.username}`}>
          <img
            src={postData.user?.dp || "/default.jpg"}
            alt=""
            className="avatar h-11 w-11"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${postData.user?.username}`}
            className="block truncate text-sm font-bold hover:underline"
          >
            {postData.user?.username || "Unknown user"}
          </Link>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            <span>{relativeTime(postData.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{postData.visibility || "public"}</span>
          </div>
        </div>

        {isOwner && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((open) => !open)}
              className="icon-button"
              title="Post options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="surface absolute right-0 top-11 z-20 w-44 p-1 shadow-xl">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditModal(true);
                  }}
                  className="btn-ghost w-full justify-start"
                >
                  <PencilLine className="h-4 w-4" />
                  Edit post
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {postData.caption && (
        <p className="whitespace-pre-wrap px-4 pb-4 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
          {postData.caption}
        </p>
      )}

      <PostMedia media={postData.media} />

      <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-2 text-xs text-zinc-500">
        <button
          onClick={openReactionList}
          disabled={!totalReactions}
          className="flex min-w-0 items-center gap-1.5 hover:text-zinc-900 disabled:cursor-default dark:hover:text-white"
        >
          <span className="flex -space-x-1">
            {activeReactionTypes.slice(0, 3).map((reaction) => {
              const ReactionIcon = reaction.Icon;
              return (
                <span
                  key={reaction.type}
                  className="grid h-5 w-5 place-items-center rounded-full border border-white bg-white dark:border-[#15171b] dark:bg-[#15171b]"
                >
                  <ReactionIcon className={`h-3.5 w-3.5 ${reaction.color}`} />
                </span>
              );
            })}
          </span>
          {totalReactions > 0 && <span>{totalReactions}</span>}
        </button>
        <button onClick={() => setShowComments((open) => !open)} className="hover:text-zinc-900 dark:hover:text-white">
          {postData.comments?.length || 0} comments
        </button>
      </div>

      <div className="grid grid-cols-3 border-t border-black/[0.07] px-2 py-1.5 dark:border-white/[0.08]">
        <div className="relative">
          <button
            onClick={() => {
              if (selectedReaction) react(selectedReaction.type);
              else setShowReactionPicker((open) => !open);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              setShowReactionPicker(true);
            }}
            className={`btn-ghost w-full ${selectedReaction?.color || ""}`}
          >
            {SelectedReactionIcon ? (
              <SelectedReactionIcon className="h-5 w-5" />
            ) : (
              <ThumbsUp className="h-5 w-5" />
            )}
            {selectedReaction?.label || "React"}
          </button>
          <button
            onClick={() => setShowReactionPicker((open) => !open)}
            className="absolute inset-y-0 right-0 w-8"
            aria-label="Choose reaction"
          />
          {showReactionPicker && (
            <div className="surface absolute bottom-12 left-0 z-20 flex gap-1 p-1.5 shadow-xl">
              {reactionOptions.map((reaction) => {
                const ReactionIcon = reaction.Icon;
                return (
                  <button
                    key={reaction.type}
                    onClick={() => react(reaction.type)}
                    className="icon-button h-9 w-9 hover:scale-105"
                    title={reaction.label}
                  >
                    <ReactionIcon className={`h-5 w-5 ${reaction.color}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={() => setShowComments((open) => !open)} className="btn-ghost w-full">
          <MessageCircle className="h-5 w-5" />
          Comment
        </button>
        <button onClick={() => setShowShareModal(true)} className="btn-ghost w-full">
          <Share2 className="h-5 w-5" />
          Share
        </button>
      </div>

      {showComments && (
        <section className="border-t border-black/[0.07] p-4 dark:border-white/[0.08]">
          <div className="space-y-3">
            {(postData.comments || []).map((comment, index) => (
              <div key={comment._id || index} className="flex items-start gap-2.5">
                <img
                  src={comment.user?.dp || "/default.jpg"}
                  alt=""
                  className="avatar h-8 w-8"
                />
                <div className="min-w-0 rounded-md bg-[#f2f3f5] px-3 py-2 dark:bg-[#1b1e23]">
                  <Link
                    to={`/profile/${comment.user?.username}`}
                    className="block text-xs font-bold hover:underline"
                  >
                    {comment.user?.username || "Unknown user"}
                  </Link>
                  <p className="mt-0.5 break-words text-sm text-zinc-700 dark:text-zinc-200">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
            {!postData.comments?.length && (
              <p className="py-3 text-center text-sm text-zinc-500">No comments yet.</p>
            )}
          </div>

          {currentUser && (
            <form onSubmit={submitComment} className="mt-4 flex items-center gap-2.5">
              <img
                src={currentUser.dp || "/default.jpg"}
                alt=""
                className="avatar h-8 w-8"
              />
              <input
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                className="field min-h-10 flex-1 py-2"
                placeholder="Write a comment"
              />
              <button
                type="submit"
                disabled={commenting || !newComment.trim()}
                className="btn-primary min-h-10 px-3"
              >
                Post
              </button>
            </form>
          )}
        </section>
      )}

      <PostFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialPostData={postData}
        onSubmit={(updatedPost) => {
          if (updatedPost) setPostData((current) => ({ ...current, ...updatedPost }));
        }}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deletePost}
        title="Delete post?"
        message="This post and its reactions will be permanently removed."
      />
      <ReactionListModal
        isOpen={showReactionList}
        onClose={() => setShowReactionList(false)}
        reactions={reactionUsers}
        loading={loadingReactions}
      />
      <ShareContentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={postData}
      />
    </article>
  );
}

function ReactionListModal({ isOpen, onClose, reactions, loading }) {
  if (!isOpen) return null;
  const people = Object.entries(reactions || {}).flatMap(([type, users]) =>
    (users || []).map((user) => ({ ...user, reactionType: type }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="surface w-full max-w-sm overflow-hidden shadow-2xl">
        <header className="flex h-14 items-center justify-between border-b border-black/[0.08] px-4 dark:border-white/[0.09]">
          <h2 className="font-bold">Reactions</h2>
          <button onClick={onClose} className="icon-button" title="Close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="skeleton h-12" />
              ))}
            </div>
          ) : (
            people.map((user) => {
              const reaction = reactionOptions.find(
                (option) => option.type === user.reactionType
              );
              const Icon = reaction?.Icon || ThumbsUp;
              return (
                <Link
                  key={`${user._id}-${user.reactionType}`}
                  to={`/profile/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md p-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  <img
                    src={user.dp || "/default.jpg"}
                    alt=""
                    className="avatar h-10 w-10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{user.username}</span>
                    <span className="block truncate text-xs text-zinc-500">{user.name}</span>
                  </span>
                  <Icon className={`h-5 w-5 ${reaction?.color || ""}`} />
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
