import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { Toaster } from "react-hot-toast";
import api from "../api/axios";
import HeaderNav from "../components/header";
import { EmptyState, PageSkeleton } from "../components/PageState";
import PostCard from "../components/PostCard";
import RightSidebar from "../components/RightSidebar";
import CreatePostComposer from "../components/user_post_card";

export default function DashBoard() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFeed = async () => {
    try {
      setError("");
      const res = await api.get("/feed");
      setFeed(res.data.feed || []);
    } catch (err) {
      console.error("Failed to fetch feed", err);
      setError("Your feed could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="app-bg pb-20 md:pb-0">
      <Toaster position="top-center" />
      <HeaderNav />

      <main className="page-wrap py-5 sm:py-7">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,720px)_320px] xl:justify-center">
          <section className="min-w-0 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Your community</p>
                <h1 className="section-title mt-1">Home feed</h1>
              </div>
              <button onClick={fetchFeed} className="btn-ghost">
                Refresh
              </button>
            </div>

            <CreatePostComposer onCreated={fetchFeed} />

            {loading ? (
              <PageSkeleton />
            ) : error ? (
              <EmptyState
                icon={Newspaper}
                title="Feed unavailable"
                description={error}
                action={
                  <button onClick={fetchFeed} className="btn-primary">
                    Try again
                  </button>
                }
              />
            ) : feed.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title="Your feed is ready for its first post"
                description="Create a post or follow people to start seeing updates here."
              />
            ) : (
              <div className="space-y-4">
                {feed.map((post) => (
                  <PostCard key={post._id} post={post} onDeleted={fetchFeed} />
                ))}
              </div>
            )}
          </section>
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
