import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../api/axios";
import EmojiPicker from "emoji-picker-react";
import EmojiTextArea from "./EmojiTextArea";

export default function PostFormModal({ isOpen, onClose, onSubmit, initialPostData = null }) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form with initial post data (for edit mode)
  useEffect(() => {
    if (initialPostData) {
      setCaption(initialPostData.caption || "");
      setVisibility(initialPostData.visibility || "public");
      setTags(initialPostData.tags?.join(", ") || "");
      setMedia(
        (initialPostData.media || []).map((m) => ({
          preview: m.url,
          type: m.type,
          existing: true, // mark as existing
        }))
      );
    } else {
      resetForm();
    }
  }, [initialPostData, isOpen]);

  const resetForm = () => {
    setCaption("");
    setMedia([]);
    setVisibility("public");
    setTags("");
    setError("");
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);

    let images = [];
    let videos = [];

    for (let file of files) {
      const type = file.type.startsWith("video") ? "video" : "image";
      const preview = URL.createObjectURL(file);
      const formatted = { file, preview, type };

      if (type === "image") {
        images.push(formatted);
      } else if (type === "video") {
        videos.push(formatted);
      }
    }

    if (videos.length > 1) return setError("You can only upload 1 video.");
    if (images.length > 6) return setError("Max 6 images allowed.");
    if (videos.length && images.length)
      return setError("Cannot upload images and video together.");

    setError("");
    setMedia([...images, ...videos]);
  };

  const handleSubmit = async () => {
    if (!!error || (!caption && media.length === 0)) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("visibility", visibility);
    formData.append("tags", tags);

    media.forEach((item) => {
      if (!item.existing) formData.append("media", item.file);
    });

    try {
      let res;
      if (initialPostData) {
        // EDIT MODE
        res = await api.patch(`/post/${initialPostData._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // CREATE MODE
        res = await api.post("/post", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      console.log("✅ Success:", res.data);
      resetForm();
      onSubmit?.();
      onClose();
    } catch (err) {
      console.error("❌ Failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 backdrop-blur-sm bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 relative border border-gray-300 dark:border-gray-700">
        <button onClick={() => { resetForm(); onClose(); }} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
          {initialPostData ? "Edit Post" : "Create a Post"}
        </h2>

        <EmojiTextArea value={caption} onChange={setCaption} />

        {media.length === 1 ? (
          <div className="mt-4 max-h-[50vh] overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            {media[0].type === "image" ? (
              <img src={media[0].preview} alt="preview" className="max-h-[50vh] w-auto mx-auto object-contain rounded" />
            ) : (
              <video src={media[0].preview} controls className="max-h-[50vh] w-full object-contain rounded" />
            )}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {media.map((m, i) => (
              <div key={i} className="w-full aspect-square overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                {m.type === "image" ? (
                  <img src={m.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                ) : (
                  <video src={m.preview} controls className="w-full h-full object-cover" />
                )}
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
          placeholder="Add tags separated by commas"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full mt-4 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
        />

        <button
          onClick={handleSubmit}
          disabled={!!error || (!caption && media.length === 0)}
          className={`mt-6 w-full ${
            !!error || (!caption && media.length === 0)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white py-2 rounded-lg text-sm font-medium`}
        >
          {loading ? "Posting..." : initialPostData ? "Update" : "Post"}
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center rounded-2xl z-50">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-700 dark:text-white font-medium">Posting...</span>
        </div>
      )}
    </div>
  );
}
