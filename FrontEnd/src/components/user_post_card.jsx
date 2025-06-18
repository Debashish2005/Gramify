import React, { useEffect, useState } from "react";
import { Video, Image, Smile } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PostFormModal from "./PostFormModal"; // Adjust the path
import toast from "react-hot-toast";

const PostCard = () => {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, []);

  if (!user) return null;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (formData) => {
    // handle form submit here (maybe call backend or set state)
    console.log("Submitted post data:", formData);
    // You can also call an API here
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mx-auto my-6 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-md border dark:border-gray-700 px-4 py-3 sm:px-6">
        {/* Top input */}
        <div className="flex items-center gap-3">
          <Link to={`/profile/${user.username}`}>
            <img
              src={user.dp || "/default-avatar.png"}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>
          <input
            type="text"
            placeholder={`What's on your mind, ${user.name.split(" ")[0]}?`}
            onFocus={openModal}
            readOnly
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition rounded-full px-4 py-2 outline-none text-sm sm:text-base text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-300 cursor-pointer"
          />
        </div>

        <hr className="my-3 border-gray-200 dark:border-gray-600" />

        {/* Action buttons */}
        <div className="flex flex-wrap justify-between gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
       <button
  className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded cursor-pointer text-red-500"
  onClick={() => toast("Live video coming soon! 🎥", {
    icon: "🚧",
    style: {
      borderRadius: '10px',
      background: '#333',
      color: '#fff',
    },
  })}
>
  <Video className="w-5 h-5" />
  <span>Live video</span>
</button>


          <button
            className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded cursor-pointer text-green-600"
            onClick={openModal}
          >
            <Image className="w-5 h-5" />
            <span>Photo/video</span>
          </button>

          <button
            className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded cursor-pointer text-yellow-500"
            onClick={openModal}
          >
            <Smile className="w-5 h-5" />
            <span>Feeling/activity</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default PostCard;
