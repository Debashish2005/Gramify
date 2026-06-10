import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function GoogleAuthButton({ text = "signin_with" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const buttonWidth = Math.max(200, Math.min(336, window.innerWidth - 80));

  if (!clientId) {
    return (
      <p className="text-center text-sm text-gray-500">
        Google sign-in is not configured.
      </p>
    );
  }

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Google did not return a valid credential.");
      return;
    }

    setError("");

    try {
      await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Google sign-in failed. Please try again."
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex min-h-10 w-full justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError("Google sign-in was cancelled or failed.")}
          text={text}
          shape="rectangular"
          size="large"
          theme="outline"
          width={String(buttonWidth)}
        />
      </div>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
