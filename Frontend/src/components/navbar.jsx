import React, { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { UserContext } from "../context/user.context";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const isLoggedIn = !!user;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md w-full z-50 max-w-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            <img src={logo} className="w-25" />
          </Link>

          <div className="flex items-center space-x-6">
            {isLoggedIn && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600 transition"
                }
              >
                Dashboard
              </NavLink>
            )}

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="ml-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-4 rounded-md transition cursor-pointer"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
