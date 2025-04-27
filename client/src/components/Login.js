import React from "react";
import { useLocation } from "react-router-dom";

const Login = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const error = params.get("error");

  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Logo and Company Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Zeta Gain</h1>
          <p className="text-blue-200">Algorithmic Trading Platform</p>
        </div>

        {/* Login Card */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white text-center mb-2">
              Welcome Back
            </h2>
            {error ? (
              <p className="text-red-300 bg-white-100 text-center">
                Login failed. Please try again!
              </p>
            ) : (
              <p className="text-gray-300 text-center">
                Sign in to access your trading dashboard
              </p>
            )}
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            <span>Login with Zerodha</span>
          </button>

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Powered by{" "}
              <span className="text-amber-400 font-medium">
                Zeta Gain Technologies
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
