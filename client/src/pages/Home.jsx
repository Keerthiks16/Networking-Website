import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./authpages/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content Area with padding to account for fixed navbar */}
      <main className="pt-16 container mx-auto flex justify-center">
        <Outlet />
      </main>
    </div>
  );
};

export default Home;
