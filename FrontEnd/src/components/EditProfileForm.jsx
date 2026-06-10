import { useEffect, useState } from "react";
import { Camera, ImagePlus, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function EditProfileForm({ userData, onUpdate }) {
  const [username, setUsername] = useState(userData?.username || "");
  const [bio, setBio] = useState(userData?.bio || "");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(userData?.dp || "");
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(userData?.banner || "");
  const [usernameError, setUsernameError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!banner) return;
    const url = URL.createObjectURL(banner);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setUsernameError("");

    try {
      if (username !== userData.username) {
        const availability = await api.get(
          `/check-username?username=${encodeURIComponent(username)}`
        );
        if (!availability.data.available) {
          setUsernameError("That username is already taken.");
          return;
        }
      }

      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      if (photo) formData.append("dp", photo);
      if (banner) formData.append("banner", banner);

      const response = await api.put("/update-profile", formData);
      toast.success("Profile updated");
      onUpdate(response.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not update your profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5">
      <div>
        <span className="mb-2 block text-sm font-bold">Profile images</span>
        <div className="relative overflow-hidden rounded-md bg-[#20242c]">
          {bannerPreview ? (
            <img src={bannerPreview} alt="" className="aspect-[3/1] w-full object-cover" />
          ) : (
            <div className="aspect-[3/1] w-full bg-[#20242c]" />
          )}
          <label className="absolute right-2 top-2 grid h-9 w-9 cursor-pointer place-items-center rounded-md bg-black/60 text-white transition hover:bg-black/75">
            <ImagePlus className="h-4 w-4" />
            <span className="sr-only">Change banner</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setBanner(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
          <label className="absolute bottom-3 left-4 cursor-pointer">
            <span className="relative block">
              <img
                src={preview || "/default-avatar.png"}
                alt=""
                className="avatar h-20 w-20 border-4 border-white shadow-md dark:border-[#15171b]"
              />
              <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </span>
            <span className="sr-only">Change profile photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Use a wide image for the banner and a square image for your profile photo.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Username</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value.trim())}
          className="field"
          required
        />
        {usernameError && <span className="mt-1.5 block text-xs text-red-600">{usernameError}</span>}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Bio</span>
        <div className="relative">
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 150))}
            className="field min-h-28 resize-none pr-11"
            rows={4}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker((open) => !open)}
            className="icon-button absolute bottom-2 right-2 h-8 w-8"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex justify-end text-xs text-zinc-500">{bio.length}/150</div>
        {showEmojiPicker && (
          <div className="mt-2 overflow-hidden">
            <EmojiPicker
              onEmojiClick={(emoji) => setBio((current) => (current + emoji.emoji).slice(0, 150))}
              theme={document.documentElement.classList.contains("dark") ? "dark" : "light"}
            />
          </div>
        )}
      </label>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
