import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserCircle, LogOut } from "lucide-react";
import useAuthStore from "../../store/zustand";
import axios from "axios";

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/api/v1/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUserData(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const navItems = [
    { name: "Network", path: "/network" },
    { name: "Discussion", path: "/discussion" },
    // { name: "Community", path: "/community" },
    // { name: "Portfolio", path: "/portfolio" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setUserData(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Website Name */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-green-600 font-bold text-xl">
              OctaNetwork
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium px-3 py-2 rounded-md transition duration-150 ease-in-out
                  ${
                    location.pathname === item.path
                      ? "text-green-500 bg-gray-700 shadow-[0_0_10px_rgba(34,197,94,0.3)] font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserCircle className="h-8 w-8 text-gray-300" />
              {userData && (
                <span className="text-sm font-medium text-gray-300">
                  {userData.username || userData.name || userData.email}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition duration-150 ease-in-out"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex flex-col space-y-2 py-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium px-2 py-2 rounded-md transition duration-150 ease-in-out
                  ${
                    location.pathname === item.path
                      ? "text-green-500 bg-gray-700 shadow-[0_0_10px_rgba(34,197,94,0.3)] font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
