import { useEffect, useRef, useState } from "react";
import { Clock3, Search, UserSearch, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import HeaderNav from "../components/header";
import { EmptyState } from "../components/PageState";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    setRecentSearches(saved);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/search-users?query=${encodeURIComponent(query.trim())}`);
        setResults(res.data.users || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const saveSearch = (username) => {
    const next = [username, ...recentSearches.filter((item) => item !== username)].slice(0, 6);
    setRecentSearches(next);
    localStorage.setItem("recentSearches", JSON.stringify(next));
  };

  return (
    <div className="app-bg pb-20 md:pb-0">
      <HeaderNav />
      <main className="page-wrap py-6 sm:py-8">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">Discover people</p>
          <h1 className="section-title mt-1">Search</h1>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field min-h-12 pl-12 pr-11 text-base"
              placeholder="Search by name or username"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="icon-button absolute right-1 top-1/2 -translate-y-1/2"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <section className="mt-6">
            {loading ? (
              <div className="surface divide-y divide-black/[0.06] p-2 dark:divide-white/[0.08]">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3">
                    <div className="skeleton h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-32" />
                      <div className="skeleton h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : query.trim() ? (
              results.length ? (
                <div className="surface divide-y divide-black/[0.06] overflow-hidden dark:divide-white/[0.08]">
                  {results.map((user) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user.username}`}
                      onClick={() => saveSearch(user.username)}
                      className="flex items-center gap-3 p-4 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    >
                      <img
                        src={user.dp || "/default-avatar.png"}
                        alt=""
                        className="avatar h-12 w-12"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{user.username}</span>
                        <span className="block truncate text-sm text-zinc-500">{user.name}</span>
                      </span>
                      <span className="text-sm font-semibold text-[#e23d58]">View profile</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={UserSearch}
                  title="No people found"
                  description={`We could not find anyone matching "${query.trim()}".`}
                />
              )
            ) : recentSearches.length ? (
              <div className="surface overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/[0.07] px-4 py-3 dark:border-white/[0.08]">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Clock3 className="h-4 w-4" />
                    Recent searches
                  </span>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem("recentSearches");
                    }}
                    className="btn-ghost min-h-8 py-1"
                  >
                    Clear
                  </button>
                </div>
                <div className="p-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    >
                      <Clock3 className="h-4 w-4 text-zinc-400" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={UserSearch}
                title="Find your people"
                description="Search by name or username to follow someone or start a conversation."
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
