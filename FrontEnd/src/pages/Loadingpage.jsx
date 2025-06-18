import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LoadingPage() {
  const navigate = useNavigate();
    useEffect(() => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/me");
        navigate("/dashboard");
      } catch (error) {
        navigate("/login");
      }
    };

    const timer = setTimeout(() => {
      checkAuth();
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white dark:bg-black px-4">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 font-[cursive]">
        Gramify
      </h1>

      <div className="mt-6 w-48 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full animate-loadingBar bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400" />
      </div>
    </div>
  );
}
