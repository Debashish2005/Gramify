import { useEffect, useState } from "react";
import { Globe2, ImagePlus, Lock, Users, X } from "lucide-react";
import api from "../api/axios";
import EmojiTextArea from "./EmojiTextArea";

const visibilityOptions = [
  { value: "public", label: "Public", description: "Anyone can see this post", Icon: Globe2 },
  { value: "friends", label: "Friends", description: "People you follow", Icon: Users },
  { value: "private", label: "Only me", description: "Visible only to you", Icon: Lock },
];

export default function PostFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialPostData = null,
}) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCaption(initialPostData?.caption || "");
    setVisibility(initialPostData?.visibility || "public");
    setTags(initialPostData?.tags?.join(", ") || "");
    setMedia(
      (initialPostData?.media || []).map((item) => ({
        preview: item.url,
        type: item.type,
        existing: true,
      }))
    );
    setError("");
  }, [initialPostData, isOpen]);

  const close = () => {
    if (loading) return;
    onClose();
  };

  const handleMediaChange = (event) => {
    const files = Array.from(event.target.files || []);
    const nextMedia = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
      existing: false,
    }));
    const combinedMedia = [...media, ...nextMedia];
    const imageCount = combinedMedia.filter((item) => item.type === "image").length;
    const videoCount = combinedMedia.filter((item) => item.type === "video").length;

    if (videoCount > 1) {
      setError("Choose one video at a time.");
      return;
    }
    if (imageCount > 6) {
      setError("Choose up to six images.");
      return;
    }
    if (videoCount && imageCount) {
      setError("Choose images or one video, not both.");
      return;
    }

    setError("");
    setMedia(combinedMedia);
  };

  const removeMedia = (index) => {
    setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    if (loading || error || (!caption.trim() && media.length === 0)) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("caption", caption.trim());
    formData.append("visibility", visibility);
    formData.append("tags", tags);
    formData.append(
      "existingMedia",
      JSON.stringify(
        media
          .filter((item) => item.existing)
          .map((item) => ({ url: item.preview, type: item.type }))
      )
    );
    media.forEach((item) => {
      if (!item.existing) formData.append("media", item.file);
    });

    try {
      const response = initialPostData
        ? await api.patch(`/post/${initialPostData._id}`, formData)
        : await api.post("/post", formData);
      onSubmit?.(response.data.post || response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "The post could not be saved.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-5">
      <div className="surface max-h-[92vh] w-full max-w-xl overflow-y-auto shadow-2xl">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-black/[0.08] bg-white px-4 dark:border-white/[0.09] dark:bg-[#15171b]">
          <div>
            <h2 className="font-bold">{initialPostData ? "Edit post" : "Create post"}</h2>
            <p className="text-xs text-zinc-500">Share an update with your community</p>
          </div>
          <button onClick={close} className="icon-button" title="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 p-4 sm:p-5">
          <EmojiTextArea
            value={caption}
            onChange={setCaption}
            placeholder="What would you like to share?"
          />

          {media.length > 0 && (
            <div className={`grid gap-2 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
              {media.map((item, index) => (
                <div
                  key={`${item.preview}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-md bg-black/[0.04] dark:bg-black/20"
                >
                  {item.type === "video" ? (
                    <video src={item.preview} controls className="h-full w-full object-contain" />
                  ) : (
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white"
                    title="Remove media"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-between rounded-md border border-dashed border-black/[0.16] p-4 transition hover:border-[#e23d58] hover:bg-[#e23d58]/[0.03] dark:border-white/[0.16]">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#e23d58]/10 text-[#e23d58]">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold">Add photos or video</span>
                <span className="block text-xs text-zinc-500">Up to 6 images or 1 video</span>
              </span>
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
              className="sr-only"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-bold">Who can see this?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {visibilityOptions.map((option) => {
                const VisibilityIcon = option.Icon;
                return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-md border p-3 transition ${
                    visibility === option.value
                      ? "border-[#e23d58] bg-[#e23d58]/[0.05]"
                      : "border-black/[0.1] hover:bg-black/[0.03] dark:border-white/[0.1] dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(event) => setVisibility(event.target.value)}
                    className="sr-only"
                  />
                  <VisibilityIcon className="mb-2 h-4 w-4" />
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="block text-xs text-zinc-500">{option.description}</span>
                </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="field"
              placeholder="travel, friends, weekend"
            />
          </label>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-black/[0.08] bg-white p-4 dark:border-white/[0.09] dark:bg-[#15171b]">
          <button onClick={close} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || Boolean(error) || (!caption.trim() && media.length === 0)}
            className="btn-primary min-w-28"
          >
            {loading ? "Saving..." : initialPostData ? "Save changes" : "Publish"}
          </button>
        </footer>
      </div>
    </div>
  );
}
