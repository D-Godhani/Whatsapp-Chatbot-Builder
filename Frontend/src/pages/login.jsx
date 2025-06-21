import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login, googleLogin } from "../services/authService";
import { UserContext } from "../context/user.context";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    isAdmin: false,
  });

  const { setUser, user } = useContext(UserContext);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
      return;
    }

    const token = localStorage.getItem("token");
    if (token) {
      setError("You are already logged in.");
      setTimeout(() => navigate("/dashboard"), 1000);
    }
  }, [navigate, user]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = await login(formData);
      localStorage.setItem("token", token);

      setUser({
        email: formData.email,
        isAdmin: formData.isAdmin,
      });

      window.dispatchEvent(new Event("tokenChange"));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const loginWithGoogle = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const jwtToken = await googleLogin(idToken);

      localStorage.setItem("token", jwtToken);

      const decoded = jwtDecode(idToken);
      const email = decoded?.email || "GoogleUser";
      const name = decoded?.name || "User";

      setUser({
        email,
        name,
        isAdmin: formData.isAdmin,
      });

      window.dispatchEvent(new Event("tokenChange"));
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login failed:", err.message);
      setError("Google login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen max-w-screen flex items-center justify-center bg-gray-200 overflow-x-hidden">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center bg-red-100 p-2 rounded">
            {error}
          </div>
        )}

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
              className="mr-2"
            />
            Login as Admin
          </label>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Sign In
          </button>

          <GoogleLogin
            onSuccess={loginWithGoogle}
            onError={() => {
              console.error("Google Login Failed");
              setError("Google login popup failed.");
            }}
          />

          <p className="mt-4 text-sm text-center">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Register
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
