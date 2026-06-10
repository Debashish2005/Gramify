import { useState } from 'react';
import Footer from "../components/footer";
import { Link, useNavigate } from 'react-router-dom';
import api from "../api/axios";
import Alert from "../components/alert"; // adjust the path if needed
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function SignupPage() {
const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    username: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ✅ Fixed: Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
     setError(""); // clear old errors

    const { email, password, name, username } = formData;

    // ✅ Validation
    if (!email || !password  || !name || !username) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

if (formData.password.length < 6) {
  setError("Password must be at least 6 characters long.");
  return;
}

if (!/[a-z]/.test(formData.password)) {
  setError("Password must contain at least one lowercase letter.");
  return;
}

if (!/[A-Z]/.test(formData.password)) {
  setError("Password must contain at least one uppercase letter.");
  return;
}

if (!/\d/.test(formData.password)) {
  setError("Password must contain at least one number.");
  return;
}

if (!/[^A-Za-z0-9]/.test(formData.password)) {
  setError("Password must contain at least one special character.");
  return;
}



if (name.length < 2 || name.length > 50) {
  setError("Name must be between 2 and 50 characters.");
  return;
}
if(/^\d+$/.test(formData.name) ){
  setError("Enter a valid name");
  return;
}

if (formData.username.length < 3 || formData.username.length > 20) {
  setError("Username must be between 3 and 20 characters.");
  return;
}

if (
  !/^[a-zA-Z0-9_]+$/.test(formData.username) ||  // only letters, numbers, underscores
  /^_/.test(formData.username) ||               // starts with _
  /_$/.test(formData.username) ||               // ends with _
  /__/.test(formData.username) ||               // consecutive underscores
  /^\d+$/.test(formData.username)               // only numbers
) {
  setError("Enter a valid username.");
  return;
}

    try {
      const response = await api.post("/signup", formData);

      if (response.data.success) {
  setSuccess("Signup successful!");
 
  setTimeout(() => {
    navigate("/login");
  }, 1000);
}
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  }; 

  return (
<>
    <div className="min-h-screen bg-white flex flex-col px-4 text-gray-900">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 font-[cursive] pb-4">
              Gramify
            </h1>
            <p className="mb-4 text-gray-600 text-sm">
              Sign up to see photos and videos from your friends.
            </p>

            <div className="mb-4">
              <GoogleAuthButton text="signup_with" />
            </div>

            <div className="flex items-center justify-center mb-4">
              <div className="border-t border-gray-300 w-1/4"></div>
              <span className="text-gray-500 px-2 text-sm">OR</span>
              <div className="border-t border-gray-300 w-1/4"></div>
            </div>

            {/* ✅ Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="email"
                placeholder="Email address"
                className="w-full px-3 py-2 bg-white rounded border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onChange={handleChange}
                value={formData.email}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full px-3 py-2 bg-white rounded border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onChange={handleChange}
                value={formData.password}
              />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-white rounded border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onChange={handleChange}
                value={formData.name}
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="w-full px-3 py-2 bg-white rounded border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onChange={handleChange}
                value={formData.username}
              />
              <p className="text-xs text-gray-500 leading-tight">
                By signing up, you agree to our <a href="#" className="text-blue-500 font-medium">Terms</a>, <a href="#" className="text-blue-500 font-medium">Privacy Policy</a> and <a href="#" className="text-blue-500 font-medium">Cookies Policy</a>.
              </p>
              {success && <Alert type="success" message={success} />}
              {error && <Alert type="error" message={error} />}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 py-2 rounded text-sm font-medium text-white hover:opacity-90"
              >
                Sign up
              </button>
            </form>
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200 text-center shadow-sm">
            <p className="text-sm">
              Have an account? <Link to="/login" className="text-blue-500 font-medium hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
</>
  );
}
