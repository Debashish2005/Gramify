import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/alert";
import AuthShell from "../components/AuthShell";
import GoogleAuthButton from "../components/GoogleAuthButton";
import api from "../api/axios";

export default function LoginPage() {
  const [formData, setFormData] = useState({ loginInput: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/login", formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your feed, messages, and activity."
      footer={
        <p className="text-sm text-zinc-500">
          New to Gramify?{" "}
          <Link to="/signup" className="font-bold text-[#e23d58] hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <GoogleAuthButton text="signin_with" />

      <div className="my-6 flex items-center gap-3 text-xs font-semibold text-zinc-400">
        <span className="h-px flex-1 bg-black/[0.09] dark:bg-white/[0.1]" />
        OR CONTINUE WITH PASSWORD
        <span className="h-px flex-1 bg-black/[0.09] dark:bg-white/[0.1]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email or username</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="loginInput"
              value={formData.loginInput}
              onChange={(event) =>
                setFormData((current) => ({ ...current, loginInput: event.target.value }))
              }
              className="field pl-10"
              autoComplete="username"
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(event) =>
                setFormData((current) => ({ ...current, password: event.target.value }))
              }
              className="field pl-10"
              autoComplete="current-password"
              required
            />
          </span>
        </label>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-[#e23d58] hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && <Alert type="error" message={error} />}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Signing in..." : "Sign in"}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}
