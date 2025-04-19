import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BaseUrl } from "../configs/clientConfig";

export default function AuthPage({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isSignUp ? `${BaseUrl}/auth/register/` : `${BaseUrl}/auth/login`;

    try {
      const response = await axios.post(url, formData, { withCredentials: true });

      if (isSignUp) {
        setIsSignUp(false);
        alert("Account created successfully! Please sign in.");
      } else if (response.data.userId) {
        console.log("Login successful:", response.data);
        onAuth();
        navigate("/snap");
      } else {
        alert("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white justify-center items-center px-4 md:px-0 relative overflow-hidden">
      {/* 💫 Background Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/4 w-[22rem] h-[22rem] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[18rem] h-[18rem] bg-cyan-500/25 rounded-full blur-[100px]" />
        <div className="absolute top-10 right-1/4 w-[16rem] h-[16rem] bg-indigo-500/20 rounded-full blur-[90px]" />
      </div>

      {/* 🔷 Logo Section */}
      <div className="flex items-center justify-center md:w-1/2 w-full mb-8 md:mb-0">
        <Link to="/" className="text-white text-5xl md:text-6xl font-bold tracking-tight flex items-center">
          <span className="">Snap</span>
          <span className="text-blue-400">Med</span>
        </Link>
      </div>

      {/* 🔐 Auth Form */}
      <div className="w-full md:w-1/2 flex justify-center p-4 z-10">
        <div className="w-full max-w-md p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 shadow-xl backdrop-blur-md rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 📱 Phone Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your mobile number e.g. +919999999999"
              />
            </div>

            {/* 🔒 Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your password"
              />
            </div>

            {/* 🚪 Submit */}
            <button
              type="submit"
              className="w-full py-3 text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 rounded-lg text-lg transition-all"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* 🔁 Toggle */}
          <p className="mt-4 text-center text-sm text-gray-300">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-400 hover:text-cyan-400 transition-all font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
