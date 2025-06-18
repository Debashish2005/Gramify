import { useState, useRef, useEffect } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Heart,
  Laugh,
  Frown,
  Angry,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { PencilLine } from "lucide-react";
import { Trash2 } from "lucide-react";
import { X } from "lucide-react";
import EmojiTextArea from "./EmojiTextArea";
import ConfirmModal from "./ConfirmModal";


const ReactionIcons = [
  { icon: <Heart className="text-red-500" />, label: "love" },
  { icon: <Laugh className="text-yellow-400" />, label: "haha" },
  { icon: <Frown className="text-blue-400" />, label: "sad" },
  { icon: <Angry className="text-red-700" />, label: "angry" },
];

const PostMedia = ({ media }) => {
  if (!media || media.length === 0) return null;
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="mt-4">
        {item.type === "image" ? (
          <img src={item.url} alt="post" className="w-full rounded-lg object-cover max-h-[600px] mx-auto" />
        ) : (
          <video controls src={item.url} className="w-full rounded-lg max-h-[600px] mx-auto" />
        )}
      </div>
    );
  }
  return (
    <div className="grid gap-2 mt-4 grid-cols-2 sm:grid-cols-3">
      {media.map((item, index) => (
        <div key={index} className="relative w-full">
          {item.type === "image" ? (
            <img src={item.url} alt={`media-${index}`} className="w-full h-48 sm:h-56 object-cover rounded-md" />
          ) : (
            <video controls src={item.url} className="w-full h-48 sm:h-56 object-cover rounded-md" />
          )}
        </div>
      ))}
    </div>
  );
};

const getTopReaction = (reactions) => {
  if (!reactions) return null;
  const sorted = Object.entries(reactions).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  return { type: sorted[0][0], count: sorted[0][1] };
};

export default function PostCard({ post }) {
  const [showReactions, setShowReactions] = useState(false);
  const [postData, setPostData] = useState(post);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(() =>
    ReactionIcons.find((r) => r.label === post.userReaction) || null
  );

  const hoverTimeout = useRef(null);
  const menuRef = useRef();
  const topReaction = getTopReaction(postData.reactions || {});
  const [currentUser, setCurrentUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const iconMap = {
    like: <ThumbsUp className="text-blue-500 w-4 h-4" />,
    love: <Heart className="text-red-500 w-4 h-4" />,
    haha: <Laugh className="text-yellow-400 w-4 h-4" />,
    sad: <Frown className="text-blue-400 w-4 h-4" />,
    angry: <Angry className="text-red-700 w-4 h-4" />,
  };

  const media = postData.media || [];

  useEffect(() => {
    setPostData(post);
    setSelectedReaction(() =>
      ReactionIcons.find((r) => r.label === post.userReaction) || null
    );
    setShowComments(false);
  }, [post]);

  useEffect(() => {
    if (postData.userReaction) {
      const found = ReactionIcons.find((r) => r.label === postData.userReaction);
      if (found) setSelectedReaction(found);
    }
  }, [postData]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/me");
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch current user:", err.message);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowReactions(true);
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setShowReactions(false), 800);
  };

  const displayLabel = (label) =>
    label.charAt(0).toUpperCase() + label.slice(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      await api.delete(`/post/${postData._id}`);
      console.log("Post deleted");

      setShowDeleteModal(false);
      window.location.reload();

      // You can also trigger a parent refresh or state update here
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-lg shadow border border-transparent dark:border-gray-700 my-4 overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${postData.user?.username}`}>
              <img
                src={postData.user?.dp || "/default.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>
            <div>
              <Link
                to={`/profile/${postData.user?.username}`}
                className="font-semibold text-sm hover:underline text-gray-800 dark:text-gray-200 pr-4"
              >
                {postData.user?.username || "Unknown"}{" "}
              </Link>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(postData.createdAt).toLocaleString()} · 🌐
              </div>
            </div>
          </div>
          <div ref={menuRef}>
 <div ref={menuRef} className="relative">
  <MoreHorizontal
    className="w-5 h-5 cursor-pointer text-gray-600 dark:text-gray-300"
    onClick={() => setShowMenu((prev) => !prev)}
  />

  {showMenu && currentUser?.id === postData.user?._id && (
    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#2c2c2c] border dark:border-gray-600 rounded-md shadow-lg z-20">
<ul className="py-1 text-sm text-gray-800 dark:text-gray-100">
<li
  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
  onClick={() => {
    setShowMenu(false);
    setShowEditModal(true);
  }}
>
  <PencilLine className="w-4 h-4" />
  Edit Post
</li>


 <li
        className="px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-2"
        onClick={() => {
          setShowMenu(false);
          setShowDeleteModal(true);
        }}
      >
        <Trash2 className="w-4 h-4" />
        Delete Post
      </li>
</ul>

    </div>
  )}
</div>

          </div>
        </div>

        {postData.caption && (
          <div className="px-4 py-2 text-gray-800 dark:text-gray-200 text-sm">
            {postData.caption}
          </div>
        )}

        <PostMedia media={media} />

        {/* Reaction summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
          <div className="flex items-center space-x-1">
            {topReaction && (
              <span className="flex items-center">
                {iconMap[topReaction.type]}
                <span className="ml-1">{topReaction.count}</span>
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <span>{postData.comments?.length || 0} comments</span>
            <span>{postData.shares || 0} shares</span>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {postData.comments?.map((comment, index) => (
                <div key={comment._id || index} className="flex gap-2 items-start">
                  <img
                    src={comment.user?.dp || "/default.jpg"}
                    alt="dp"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="bg-gray-100 mt-2 dark:bg-[#2c2c2c] px-3 py-2 rounded-2xl max-w-[85%]">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {comment.user?.username || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            {currentUser && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newComment.trim()) return;
                  try {
                    const res = await api.post(`/feed/${postData._id}/comment`, {
                      text: newComment,
                    });
                    setPostData((prev) => ({
                      ...prev,
                      comments: [...(prev.comments || []), res.data.comment],
                    }));
                    setNewComment("");
                  } catch (err) {
                    console.error("Failed to post comment:", err.response?.data || err.message);
                  }
                }}
                className="flex items-center gap-2 mt-4"
              >
                <img
                  src={currentUser.dp || "/default.jpg"}
                  alt="dp"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Comment as ${currentUser.username}`}
                  className="flex-1 bg-gray-100 dark:bg-[#2c2c2c] rounded-full px-4 py-2 text-sm outline-none text-gray-800 dark:text-white"
                />
              </form>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-around text-gray-700 dark:text-gray-300 text-sm font-medium py-2">
          <div
            className="relative flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-1 rounded cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {selectedReaction ? (
              <span className="w-5 h-5">{selectedReaction.icon}</span>
            ) : (
              <ThumbsUp className="w-5 h-5" />
            )}
            <span>
              {selectedReaction ? displayLabel(selectedReaction.label) : "Like"}
            </span>

            {showReactions && (
              <div
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[#2c2c2c] rounded-full shadow px-2 py-1 flex space-x-2 z-10 border dark:border-gray-600"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {ReactionIcons.map((reaction, i) => (
                  <div
                    key={i}
                    className="hover:scale-110 transition-transform duration-150 cursor-pointer"
                    title={displayLabel(reaction.label)}
                    onClick={async () => {
                      setSelectedReaction(reaction);
                      setShowReactions(false);
                      try {
                        const res = await api.post(`/feed/${postData._id}/react`, {
                          type: reaction.label,
                        });
                        if (res.data && res.data.reactions) {
                          setPostData((prev) => ({
                            ...prev,
                            reactions: Object.fromEntries(
                              Object.entries(res.data.reactions).map(([k, v]) => [k, v.length])
                            ),
                            userReaction: reaction.label,
                          }));
                        }
                      } catch (err) {
                        console.error("Failed to react:", err.response?.data || err.message);
                      }
                    }}
                  >
                    {reaction.icon}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-1 rounded cursor-pointer"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
          </div>

          <div className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-1 rounded cursor-pointer">
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </div>
        </div>
      </div>
      <EditPostModal
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  post={postData}
  onSave={async (newCaption) => {
    try {
      const res = await api.put(`/feed/${postData._id}`, { caption: newCaption });
      setPostData((prev) => ({ ...prev, caption: res.data.caption }));
      setShowEditModal(false);
    } catch (err) {
      console.error("Edit failed:", err.response?.data || err.message);
    }
  }}
/>

  <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
}

function EditPostModal({ isOpen, onClose, post, onSave }) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const initialized = useRef(false);

useEffect(() => {
  if (isOpen && post && !initialized.current) {
    setCaption(post.caption || "");
    setVisibility(post.visibility || "public");
    setTags(post.tags?.join(", ") || "");
    setMedia(
      (post.media || []).map((m) => ({
        preview: m.url,
        type: m.type,
        existing: true,
      }))
    );
    initialized.current = true; // prevent future resets
  }
}, [isOpen, post]);

// Reset initialized flag when modal closes
useEffect(() => {
  if (!isOpen) {
    initialized.current = false;
  }
}, [isOpen]);
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);

    let images = [];
    let videos = [];

    for (let file of files) {
      const type = file.type.startsWith("video") ? "video" : "image";
      const preview = URL.createObjectURL(file);
      const formatted = { file, preview, type };

      if (type === "image") images.push(formatted);
      else if (type === "video") videos.push(formatted);
    }

    const allMedia = [...media, ...images, ...videos];
    const imageCount = allMedia.filter((m) => m.type === "image").length;
    const videoCount = allMedia.filter((m) => m.type === "video").length;

    if (videoCount > 1) return setError("You can only upload 1 video.");
    if (imageCount > 6) return setError("Max 6 images allowed.");
    if (videoCount && imageCount)
      return setError("Cannot upload images and video together.");

    setError("");
    setMedia(allMedia);
  };

  const handleRemoveMedia = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handleSave = async () => {
    if (!!error || (!caption && media.length === 0)) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("visibility", visibility);
    formData.append("tags", tags);

    media.forEach((m) => {
      if (!m.existing) formData.append("media", m.file);
    });

    try {
      const res = await api.patch(`/post/${post._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSave?.(res.data);
      onClose();
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 backdrop-blur-sm bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 relative border border-gray-300 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
          Edit Post
        </h2>

        <EmojiTextArea value={caption} onChange={setCaption} />

        {media.length === 1 ? (
          <div className="mt-4 relative max-h-[50vh] overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            {media[0].type === "image" ? (
              <img src={media[0].preview} className="max-h-[50vh] w-auto mx-auto object-contain rounded" />
            ) : (
              <video src={media[0].preview} controls className="max-h-[50vh] w-full object-contain rounded" />
            )}
            <button
              onClick={() => handleRemoveMedia(0)}
              className="absolute top-1 right-1 text-white bg-red-500 rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {media.map((m, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                {m.type === "image" ? (
                  <img src={m.preview} className="w-full h-full object-cover" />
                ) : (
                  <video src={m.preview} controls className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => handleRemoveMedia(i)}
                  className="absolute top-1 right-1 text-white bg-red-500 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleMediaChange}
          className="mt-4 w-full text-sm text-gray-500 dark:text-gray-400"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="w-full mt-4 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
        >
          <option value="public">Public</option>
          <option value="friends">Friends</option>
          <option value="private">Private</option>
        </select>

        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full mt-4 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
        />

        <button
          onClick={handleSave}
          disabled={!!error || (!caption && media.length === 0)}
          className={`mt-6 w-full ${
            !!error || (!caption && media.length === 0)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white py-2 rounded-lg text-sm font-medium`}
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center rounded-2xl z-50">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-700 dark:text-white font-medium">Updating...</span>
        </div>
      )}
    </div>
  );
}
