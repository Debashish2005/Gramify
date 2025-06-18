import React, { useState } from "react";
import api from "../api/axios"; // Adjust the import based on your project structure
const Input = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition ${className}`}
      {...props}
    />
  );
});

const Button = React.forwardRef(({ className = "", children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post("/forgot-password", { email });
    setMessage(response.data.message);
  } catch (error) {
    console.error(error);
    setMessage("Something went wrong. Please try again.");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-pink-600">
          Reset Your Password
        </h2>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
          required
        />
        <Button type="submit" className="w-full bg-pink-500 text-white">
          Send Reset Link
        </Button>
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
}
