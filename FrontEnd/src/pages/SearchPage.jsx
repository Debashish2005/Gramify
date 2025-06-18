import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import HeaderNav from "../components/header"
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
    const navigate = useNavigate();
    const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        navigate("/"); // or any fallback route
      }
    };

    handleResize(); // Run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const inputRef = useRef(null); // 👈 reference to the input

  useEffect(() => {
    // 👇 Focus input when page loads
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  useEffect(() => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

 useEffect(() => {
  const delayDebounce = setTimeout(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true); // Start shimmer
      try {
        const res = await api.get(`/search-users?query=${searchQuery}`);
        setSearchResults(res.data.users);
      } catch (err) {
        console.error("Search failed", err);
      }
      setSearchLoading(false); // End shimmer
    };

    fetchUsers();
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [searchQuery]);

  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches on mount
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(history);
    inputRef.current?.focus(); // Auto-focus on open
  }, []);

  // Save search on Enter or result click
  const saveSearch = (query) => {
    if (!query.trim()) return;

    let history = JSON.parse(localStorage.getItem("recentSearches")) || [];
    history = [query, ...history.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(history));
    setRecentSearches(history);
  };

  // Clear all history
  const clearHistory = () => {
    localStorage.removeItem("recentSearches");
    setRecentSearches([]);
  };

  return (
    <>
    <HeaderNav/>
    <div className="h-[calc(100vh-56px)] bg-white dark:bg-black px-4 py-2 overflow-y-auto">

      {/* Top Search Bar */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          ref={inputRef} // 👈 attach the ref
          type="text"
          placeholder="Search users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
        />
      </div>

{/* Recent Searches (if input is empty) */}
{searchQuery.trim() === "" && recentSearches.length > 0 && (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Searches</span>
      <button
        onClick={clearHistory}
        className="text-xs text-red-500 hover:underline"
      >
        Clear All
      </button>
    </div>
    <ul className="space-y-2">
      {recentSearches.map((query, i) => (
        <li
          key={i}
          onClick={() => {
            setSearchQuery(query);
            saveSearch(query);
          }}
          className="cursor-pointer px-3 py-2 bg-gray-100 dark:bg-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {query}
        </li>
      ))}
    </ul>
  </div>
)}

      {/* Results */}
{searchLoading ? (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-2 rounded-md bg-gray-100 dark:bg-gray-800"
      >
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-3 w-1/4 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
      </div>
    ))}
  </div>
) : (
  searchResults.length > 0 && (
    <div className="space-y-2">
      {searchResults.map((user) => (
        <Link
          key={user._id}
          to={`/profile/${user.username}`}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          onClick={() => {
            saveSearch(user.username);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <img
            src={user.dp || "/default-avatar.png"}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white">
              {user.username}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {user.name}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
)}


    </div>
    </>
  );
}
