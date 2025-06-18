import DarkmodeToggle from './DarkmodeToggle';

export default function RightSidebar() {
  // Dummy users (simulate backend)
  const onlineUsers = [
    {
      _id: "1",
      name: "Aryan",
      username: "aryan_01",
      dp: "/profile1.jpg",
    },
    {
      _id: "2",
      name: "Megha",
      username: "megha_singh",
      dp: "/profile2.jpg",
    },
    {
      _id: "3",
      name: "Anjali",
      username: "anjali.k",
      dp: "/profile3.jpg",
    },
  ];

  return (
    <div className="hidden md:block w-[300px] space-y-4 mt-2 p-4">
      {/* Online Friends */}
      <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border border-transparent dark:border-gray-700 drop-shadow-[0_-4px_6px_rgba(0,0,0,0.1)] shadow-md dark:shadow-black/30">
        <h2 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">
          Online Friends
        </h2>
        <ul className="space-y-2">
          {onlineUsers.map((user) => (
            <li key={user._id} className="flex items-center space-x-2">
              <img
                src={user.dp || "/default-dp.jpg"}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
              <span className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
            </li>
          ))}
        </ul>
      </div>

      {/* Sponsored Section */}
      <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border border-transparent dark:border-gray-700 drop-shadow-[0_-4px_6px_rgba(0,0,0,0.1)] shadow-md dark:shadow-black/30">
        <h2 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">
          Sponsored
        </h2>
        <img src="/ad1.jpg" alt="Ad" className="rounded" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shop the latest trends!</p>
      </div>
    </div>
  );
}
