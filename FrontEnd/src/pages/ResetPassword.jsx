import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/alert";
import AuthShell from "../components/AuthShell";
import api from "../api/axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) setError("This reset link is invalid or has expired.");
  }, [email, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/reset-password", { email, token, password });
      setMessage(response.data.message || "Password updated.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset the password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      description="Use a password you do not use for another account."
      footer={
        <p className="text-sm text-zinc-500">
          Remembered it?{" "}
          <Link to="/login" className="font-bold text-[#e23d58]">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">New password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
            autoComplete="new-password"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="field"
            autoComplete="new-password"
            required
          />
        </label>
        {message && <Alert type="success" message={message} />}
        {error && <Alert type="error" message={error} />}
        <button
          type="submit"
          disabled={submitting || !token || !email}
          className="btn-primary w-full"
        >
          {submitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
