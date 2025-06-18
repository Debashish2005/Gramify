import { useEffect, useState } from "react";

export default function DarkModeToggle({ useSwitchStyle = false }) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // 🟢 Dropdown toggle UI
  if (useSwitchStyle) {
    return (
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">
          Theme: {isDark ? "Dark" : "Light"}
        </span>
        <button
          onClick={toggleDarkMode}
          className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300 ${
              isDark ? "translate-x-6 bg-yellow-400" : "translate-x-1 bg-white"
            }`}
          />
        </button>
      </div>
    );
  }

  // 🔵 Default button (if used elsewhere)
  return (
    <button
      onClick={toggleDarkMode}
      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-md shadow"
    >
      {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
