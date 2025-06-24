import React, { useState, useEffect } from "react";
import axios from "axios";
import { Check, X } from "lucide-react";

const PendingRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch pending connection requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get("/api/v1/connections/requests");
        setPendingRequests(response.data);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        alert("Failed to fetch pending connection requests");
      }
    };

    fetchPendingRequests();
  }, []);

  // Handle accepting a connection request
  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await axios.put(
        `/api/v1/connections/${requestId}/accept`
      );

      // Remove the accepted request from the list
      setPendingRequests(
        pendingRequests.filter((req) => req._id !== requestId)
      );

      alert(response.data.message);
    } catch (error) {
      console.error("Error accepting request:", error);
      alert(
        error.response?.data?.message || "Failed to accept connection request"
      );
    }
  };

  // Handle rejecting a connection request
  const handleRejectRequest = async (requestId) => {
    try {
      const response = await axios.put(
        `/api/v1/connections/${requestId}/reject`
      );

      // Remove the rejected request from the list
      setPendingRequests(
        pendingRequests.filter((req) => req._id !== requestId)
      );

      alert(response.data.message);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(
        error.response?.data?.message || "Failed to reject connection request"
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
          Pending Connection Requests
        </h1>

        {pendingRequests.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No pending connection requests
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-between 
                  shadow-lg border border-gray-700 hover:border-green-500 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={
                        request.sender.profilePicture || "/default-avatar.png"
                      }
                      alt={request.sender.name}
                      className="w-16 h-16 rounded-full border-2 border-green-500 
                        ring-2 ring-offset-2 ring-offset-gray-800 ring-green-500"
                    />
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full 
                      animate-pulse"
                    ></div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-green-300">
                      {request.sender.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {request.sender.headline || "No headline"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="mr-1">🔗</span>
                      {request.sender.connections.length} connections
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="bg-green-500/20 hover:bg-green-500/40 text-green-300 
                      p-2 rounded-full border border-green-500 transition-all 
                      hover:scale-110 hover:shadow-lg hover:shadow-green-500/50"
                  >
                    <Check className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-300 
                      p-2 rounded-full border border-red-500 transition-all 
                      hover:scale-110 hover:shadow-lg hover:shadow-red-500/50"
                  >
                    <X className="w-6 h-6" />
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

export default PendingRequests;
