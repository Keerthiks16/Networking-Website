import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";

const MyConnections = () => {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/v1/connections");
        setConnections(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching connections:", error);
        setError("Failed to fetch connections");
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, []);

  // Handle removing a connection
  const handleRemoveConnection = async (connectionId) => {
    try {
      // Show confirmation dialog
      const confirmRemove = window.confirm(
        "Are you sure you want to remove this connection?"
      );

      if (!confirmRemove) return;

      const response = await axios.delete(
        `/api/v1/connections/${connectionId}/remove`
      );

      // Remove the connection from the list
      setConnections(connections.filter((conn) => conn._id !== connectionId));

      alert(response.data.message);
    } catch (error) {
      console.error("Error removing connection:", error);
      alert(error.response?.data?.message || "Failed to remove connection");
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Loading Connections...
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <div className="max-w-4xl mx-auto text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
          My Connections
        </h1>

        {connections.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            You have no connections yet
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection._id}
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-between 
                  shadow-lg border border-gray-700 hover:border-blue-500 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={connection.profilePicture || "/default-avatar.png"}
                      alt={connection.name}
                      className="w-16 h-16 rounded-full border-2 border-blue-500 
                        ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-blue-300">
                      {connection.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {connection.headline || "No headline"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="mr-1">🔗</span>
                      {connection.connections.length} connections
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleRemoveConnection(connection._id)}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-300 
                      p-2 rounded-full border border-red-500 transition-all 
                      hover:scale-110 hover:shadow-lg hover:shadow-red-500/50"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyConnections;
