import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

export default function NotFound() {
  return (
    <main className="app-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Brand to="/" />
        <p className="eyebrow mt-10">404</p>
        <h1 className="mt-2 text-3xl font-black">This page is not here</h1>
        <p className="subtle-text mt-3">
          The link may be outdated, or the page may have moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </main>
  );
}
