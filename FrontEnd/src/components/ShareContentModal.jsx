import { Check, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function ShareContentModal({ isOpen, onClose, post }) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState("");
  const [sentTo, setSentTo] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSearchResults([]);
    setSentTo([]);
    setLoading(true);
    Promise.all([api.get("/conversations"), api.get("/me")])
      .then(([response, meResponse]) => {
        setCurrentUserId(meResponse.data.user.id);
        setPeople(
          response.data.map((person) => ({
            _id: person.userId,
            username: person.name,
            name: person.displayName,
            dp: person.dp,
          }))
        );
      })
      .catch(() => toast.error("Could not load conversations"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.get(
          `/search-users?query=${encodeURIComponent(query.trim())}`
        );
        setSearchResults(response.data.users || []);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, query]);

  const visiblePeople = useMemo(() => {
    const source = query.trim() ? searchResults : people;
    return source.filter(
      (person, index) =>
        person._id !== currentUserId &&
        source.findIndex((candidate) => candidate._id === person._id) === index
    );
  }, [currentUserId, people, query, searchResults]);

  const shareWith = async (person) => {
    if (sendingTo || sentTo.includes(person._id)) return;
    setSendingTo(person._id);
    try {
      await api.post(`/posts/${post._id}/share`, { to: person._id });
      setSentTo((current) => [...current, person._id]);
      toast.success(`Sent to ${person.username}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not share this content");
    } finally {
      setSendingTo("");
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3"
      onClick={onClose}
    >
      <section
        className="flex h-[min(620px,calc(100dvh-24px))] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-[#15171b]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/[0.08] px-4 dark:border-white/[0.09]">
          <div>
            <h2 className="font-bold">Share {post.contentType === "reel" ? "reel" : "post"}</h2>
            <p className="text-xs text-zinc-500">Send it in a conversation</p>
          </div>
          <button onClick={onClose} className="icon-button" title="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field min-h-11 pl-9"
              placeholder="Search people"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {loading ? (
            <div className="space-y-2 p-1">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="skeleton h-16" />
              ))}
            </div>
          ) : visiblePeople.length ? (
            visiblePeople.map((person) => {
              const sent = sentTo.includes(person._id);
              return (
                <button
                  key={person._id}
                  onClick={() => shareWith(person)}
                  disabled={Boolean(sendingTo) || sent}
                  className="flex w-full items-center gap-3 rounded-md p-3 text-left transition hover:bg-black/[0.04] disabled:opacity-70 dark:hover:bg-white/[0.05]"
                >
                  <img
                    src={person.dp || "/default.jpg"}
                    alt=""
                    className="avatar h-11 w-11"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {person.name || person.username}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      @{person.username}
                    </span>
                  </span>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      sent ? "bg-emerald-100 text-emerald-700" : "bg-blue-600 text-white"
                    }`}
                  >
                    {sent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="grid h-40 place-items-center px-8 text-center text-sm text-zinc-500">
              {query ? "No people found." : "Start a conversation to see people here."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
