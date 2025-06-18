import React, { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

const EmojiTextArea = ({ value, onChange, placeholder = "What's on your mind?" }) => {
  const textareaRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = value.slice(0, start) + emoji + value.slice(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        rows="3"
        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <button
        type="button"
        onClick={() => setShowPicker((prev) => !prev)}
        className="absolute bottom-2 right-3 text-xl"
      >
        😊
      </button>

      {showPicker && (
        <div className="absolute bottom-12 right-0 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}
    </div>
  );
};

export default EmojiTextArea;
