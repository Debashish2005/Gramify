import { useRef, useState } from "react";
import { Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function EmojiTextArea({
  value,
  onChange,
  placeholder = "What is on your mind?",
}) {
  const textareaRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);

  const addEmoji = (emojiData) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const nextValue = value.slice(0, start) + emojiData.emoji + value.slice(end);
    onChange(nextValue);
    setTimeout(() => textarea?.focus(), 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field min-h-32 resize-none pr-12 text-base leading-6"
      />
      <button
        type="button"
        onClick={() => setShowPicker((open) => !open)}
        className="icon-button absolute bottom-2 right-2 h-9 w-9"
        title="Add emoji"
      >
        <Smile className="h-5 w-5" />
      </button>
      {showPicker && (
        <div className="absolute bottom-12 right-0 z-30 max-w-[calc(100vw-2rem)]">
          <EmojiPicker
            onEmojiClick={addEmoji}
            theme={document.documentElement.classList.contains("dark") ? "dark" : "light"}
          />
        </div>
      )}
    </div>
  );
}
