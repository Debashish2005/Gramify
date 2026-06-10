import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const LoginPage = lazy(() => import("./pages/landing_page"));
const SignupPage = lazy(() => import("./pages/signup"));
const LoadingPage = lazy(() => import("./pages/Loadingpage"));
const DashBoard = lazy(() => import("./pages/dashboard"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Notifications = lazy(() => import("./pages/notifications"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Messages = lazy(() => import("./pages/messages"));
const Reels = lazy(() => import("./pages/Reels"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="app-bg grid min-h-screen place-items-center">
      <div className="flex items-center gap-3 text-sm font-semibold text-zinc-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-[#e23d58]" />
        Loading Gramify
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LoadingPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
