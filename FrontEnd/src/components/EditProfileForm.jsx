import { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react"; // ✅ use this


const EditProfileForm = ({ userData, onUpdate }) => {
  const [username, setUsername] = useState(userData?.username || "");
  const [bio, setBio] = useState(userData?.bio || "");
  const [dp, setDp] = useState(null);
  const [dpPreview, setDpPreview] = useState(userData?.dp || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ✅

  useEffect(() => {
    if (dp) {
      const url = URL.createObjectURL(dp);
      setDpPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [dp]);

  const validateUsername = async () => {
    if (username === userData.username) return true;

    try {
      const res = await axios.get(`/check-username?username=${username}`);
      return res.data.available;
    } catch (err) {
      console.error("Username validation failed:", err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUsernameError("");

    if (bio.length > 150) {
      toast.error("Bio can't exceed 150 characters");
      setIsSubmitting(false);
      return;
    }

    const isUnique = await validateUsername();
    if (!isUnique && username !== userData.username) {
      setUsernameError("Username is already taken");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    if (dp) formData.append("dp", dp);

    try {
      const res = await axios.put("/update-profile", formData);
      toast.success("Profile updated");
      onUpdate(res.data);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    setBio((prev) => (prev + emojiData.emoji).slice(0, 150));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 w-full max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg"
    >
      {/* Profile Picture Upload */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
          Profile Picture
        </label>
        {dpPreview && (
          <img
            src={dpPreview}
            alt="Preview"
            className="w-24 h-24 object-cover rounded-full mb-2 border border-gray-300 dark:border-gray-600"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setDp(e.target.files[0])}
          className="text-sm text-gray-700 dark:text-gray-300"
        />
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring"
          required
        />
        {usernameError && (
          <p className="text-sm text-red-500 mt-1">{usernameError}</p>
        )}
      </div>

      {/* Bio with Emoji Picker */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={150}
          rows={3}
          className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {bio.length}/150 characters
          </p>
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-sm text-blue-500 "
          >
            {showEmojiPicker ? "Close Emoji" : "Add Emoji 😊"}
          </button>
        </div>
        {showEmojiPicker && (
          <div className="mt-2">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};

export default EditProfileForm;
