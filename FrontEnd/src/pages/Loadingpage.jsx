import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import api from "../api/axios";

export default function LoadingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api
      .get("/me")
      .then(() => active && navigate("/dashboard", { replace: true }))
      .catch(() => active && navigate("/login", { replace: true }));
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center px-4">
      <Brand to="/" />
      <div className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.1]">
        <div className="h-full w-1/2 animate-loadingBar rounded-full bg-[#e23d58]" />
      </div>
      <p className="mt-3 text-xs font-semibold text-zinc-500">Loading your space</p>
    </div>
  );
}
