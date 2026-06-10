import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import Footer from "../components/footer";
import { Link, useNavigate } from 'react-router-dom';
import Alert from "../components/alert";
import api from "../api/axios";
import GoogleAuthButton from "../components/GoogleAuthButton";

function Input({ type, placeholder, className = '', value, onChange, name, required }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 ${className}`}
    />
  );
}


function Button({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 ${className}`}
    >
      {children}
    </button>
  );
}



export default function LoginPage() {
 const [formData, setFormData] = useState({
    loginInput : "",
    password : "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

function handleChange(e) {
  const name = e.target.name;
  const value = e.target.value;

  setFormData({
    ...formData,
    [name]: value
  });
}

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const { loginInput, password } = formData;
  try {
  const response = await api.post(
  "/login",
  { loginInput, password },
  { withCredentials: true }
);

    console.log(response.data);
    if (response.status === 200) {
      setSuccess("Login successful!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    }
  } catch (error) {
    setError(error.response?.data?.error || "Login failed. Please try again.");
  }
};

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md z-20 relative">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 font-[cursive]">
          Gramify
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-gradient-to-tr from-pink-500 via-purple-600 to-teal-400 ">
        {/* Left Section */}
        <div className="hidden md:flex flex-col justify-center items-start px-16 py-10 bg-gradient-to-br from-teal-300 to-pink-400 relative overflow-hidden">
 <div className='flex justify-center align-center items-center'>
          <div>
           <Motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-white text-6xl font-extrabold mb-4 z-10"
          >
            Welcome to Gramify
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-white text-lg z-10 mb-6 max-w-md"
          >
            Gramify is your vibrant digital diary. Snap, post, and share your moments with the world. Connect, explore, and be inspired.
          </Motion.p>

          <Motion.div
            className="text-white text-xl font-semibold space-y-3 z-10"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 1
                }
              }
            }}
          >
            {["Snap your life", "Connect with friends", "Explore colorful stories"].map((line, i) => (
              <Motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: i * 1 }}
              >
                {line}
              </Motion.div>
            ))}
          </Motion.div>
         </div>

   <Motion.img
  src="/img1.jpg"
  alt="App preview"
  className="w-[300px] mt-10 rounded-xl shadow-2xl z-10"
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 1, delay: 1.5 }}
/>

 </div>

        </div>

        {/* Right Section */}
        <div className="flex flex-col justify-center items-center p-10 bg-white z-10 border-t border-gray-100">
          <h2 className="text-4xl font-bold text-pink-600 mb-6">Login to Gramify</h2>
          <div className="w-full max-w-sm mb-4">
            <GoogleAuthButton text="signin_with" />
          </div>
          <div className="flex items-center w-full max-w-sm mb-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
      <form className="flex flex-col items-center w-full max-w-sm" onSubmit={handleSubmit}>
      <Input
        type="text"
        name="loginInput"
        placeholder="Username or email address"
        value={formData.loginInput}
        onChange={handleChange}
        className="mb-4 w-full max-w-md"
        required
      />
      <Input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        className="mb-6 w-full max-w-md"
        required
      />
      <Link
   to="/forgot-password"
  className="self-start text-sm text-blue-500 hover:underline mb-4 ml-2"
>
  Forgot password?
</Link>

      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}
      <Button
        type="submit"
        className="w-full max-w-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
      >
        Log In
      </Button>
    </form>
          <p className="text-sm text-gray-500 mt-4">
            Don't have an account?  <Link to="/signup" className="text-teal-500 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer></Footer>
    </div>
  );
}
