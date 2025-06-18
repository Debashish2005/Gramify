import { useState, useEffect } from "react";
import HeaderNav from "../components/header";
import UserCard from "../components/user_post_card";
import PostCard from "../components/PostCard";
import RightSidebar from "../components/RightSidebar";
import { Toaster } from "react-hot-toast";
import api from "../api/axios"; 

export default function DashBoard() {
  const [feed, setFeed] = useState([]);

useEffect(() => {
  const fetchFeed = async () => {
    try {
      const res = await api.get("/feed");
      setFeed(res.data.feed);
    } catch (err) {
      console.error("Failed to fetch feed", err);
    }
  };

  // Initial fetch
  fetchFeed();

  // Refresh feed every 5 seconds
  const interval = setInterval(fetchFeed, 5000);

  // Cleanup
  return () => clearInterval(interval);
}, []);
useEffect(() => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <HeaderNav />

        {/* Main Layout */}
       
          {/* Scrollable Center Content */}
          <div className="flex-1 overflow-y-auto md:mr-64">
            <UserCard />
            <div className="flex flex-col">
              {feed.length === 0 ? (
                <div className="text-center text-gray-500 p-6">
                  No posts to show
                </div>
              ) : (
                feed.map((post) => <PostCard key={post._id} post={post} />)
              )}
            </div>
          </div>
      </div>
    </>
  );
}
