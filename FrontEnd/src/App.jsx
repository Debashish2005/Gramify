// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/landing_page';
import SignupPage from './pages/signup';
import LoadingPage from "./pages/Loadingpage";
import DashBoard from './pages/dashboard';
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from './pages/ProfilePage';
import EditProfileForm from './components/EditProfileForm';
import Notifications from './pages/notifications';
import SearchPage from './pages/SearchPage'
import Messages from './pages/messages'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/notifications" element = {<Notifications/>}/>
        <Route path="/search" element={<SearchPage />} />
        <Route path = "/messages" element={<Messages/>}/>
      </Routes>
    </Router>
  );
}

export default App;

