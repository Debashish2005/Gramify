import { Link } from "react-router-dom";

export default function Brand({ to = "/dashboard", compact = false, light = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 font-black ${
        compact ? "text-xl" : "text-2xl"
      } ${light ? "text-white" : "text-[#17181c] dark:text-white"}`}
      aria-label="Gramify home"
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-[#e23d58] text-sm text-white">
        G
      </span>
      <span>Gramify</span>
    </Link>
  );
}
