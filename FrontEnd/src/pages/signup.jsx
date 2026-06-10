import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/alert";
import AuthShell from "../components/AuthShell";
import GoogleAuthButton from "../components/GoogleAuthButton";
import api from "../api/axios";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Enter a valid email address.";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      return "Username must be 3-20 characters using letters, numbers, or underscores.";
    }
    if (
      formData.password.length < 8 ||
      !/[a-z]/.test(formData.password) ||
      !/[A-Z]/.test(formData.password) ||
      !/\d/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      return "Use 8+ characters with uppercase, lowercase, number, and symbol.";
    }
    if (formData.name.trim().length < 2) return "Enter your full name.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await api.post("/signup", {
        ...formData,
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Join the people and conversations that matter to you."
      footer={
        <p className="text-sm text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#e23d58] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleAuthButton text="signup_with" />

      <div className="my-6 flex items-center gap-3 text-xs font-semibold text-zinc-400">
        <span className="h-px flex-1 bg-black/[0.09] dark:bg-white/[0.1]" />
        OR USE EMAIL
        <span className="h-px flex-1 bg-black/[0.09] dark:bg-white/[0.1]" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold">Full name</span>
          <input name="name" value={formData.name} onChange={handleChange} className="field" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Username</span>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="field"
            autoComplete="username"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="field"
            autoComplete="email"
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold">Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="field"
            autoComplete="new-password"
            required
          />
          <span className="mt-1.5 block text-xs text-zinc-500">
            8+ characters with uppercase, lowercase, number, and symbol.
          </span>
        </label>

        {error && (
          <div className="sm:col-span-2">
            <Alert type="error" message={error} />
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary sm:col-span-2">
          {submitting ? "Creating account..." : "Create account"}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}
