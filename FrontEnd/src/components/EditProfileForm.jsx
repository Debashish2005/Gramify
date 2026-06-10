import { useEffect, useState } from "react";
import { Camera, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function EditProfileForm({ userData, onUpdate }) {
  const [username, setUsername] = useState(userData?.username || "");
  const [bio, setBio] = useState(userData?.bio || "");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(userData?.dp || "");
  const [usernameError, setUsernameError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

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
      <div className="flex items-center gap-4">
        <img
          src={preview || "/default-avatar.png"}
          alt=""
          className="avatar h-20 w-20"
        />
        <label className="btn-secondary cursor-pointer">
          <Camera className="h-4 w-4" />
          Change photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPhoto(event.target.files?.[0] || null)}
            className="sr-only"
          />
        </label>
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
