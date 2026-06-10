import { useEffect, useState } from "react";
import { ImagePlus, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PostFormModal from "./PostFormModal";

export default function CreatePostComposer({ onCreated }) {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    api
      .get("/me")
      .then((res) => setUser(res.data.user))
      .catch((err) => console.error("Failed to load composer user", err));
  }, []);

  if (!user) return <div className="surface skeleton h-20" />;

  return (
    <>
      <section className="surface p-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${user.username}`}>
            <img
              src={user.dp || "/default-avatar.png"}
              alt=""
              className="avatar h-11 w-11"
            />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex min-h-11 min-w-0 flex-1 items-center rounded-md bg-[#f2f3f5] px-4 text-left text-sm text-zinc-500 transition hover:bg-[#e9ebee] dark:bg-[#1b1e23] dark:text-zinc-400 dark:hover:bg-[#22252b]"
          >
            Share something with your community
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="icon-button text-[#e23d58]"
            title="Add photo or video"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-[#e23d58] dark:text-zinc-400"
        >
          <PenLine className="h-4 w-4" />
          Create a post
        </button>
      </section>

      <PostFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={onCreated}
      />
    </>
  );
}
