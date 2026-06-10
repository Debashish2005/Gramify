import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api/axios";

export default function GoogleAuthButton({ text = "signin_with" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const buttonWidth = Math.max(200, Math.min(336, window.innerWidth - 80));

  if (!clientId) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800">
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
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      setAuthToken(response.data.token);
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
      <div className="flex min-h-11 w-full justify-center overflow-hidden rounded-md border border-black/[0.12] bg-white">
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
