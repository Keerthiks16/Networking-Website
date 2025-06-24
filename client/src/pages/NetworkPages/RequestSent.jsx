import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock } from "lucide-react";

const RequestSent = () => {
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sent connection requests
  useEffect(() => {
    const fetchSentRequests = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/v1/connections/sentrequests");
        setSentRequests(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sent requests:", error);
        setError("Failed to fetch sent connection requests");
        setIsLoading(false);
      }
    };

    fetchSentRequests();
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Loading Sent Requests...
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
          Sent Connection Requests
        </h1>

        {sentRequests.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            You have no sent connection requests
          </div>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((request) => (
              <div
                key={request._id}
                className="bg-gray-800 rounded-xl p-4 flex items-center justify-between 
                  shadow-lg border border-gray-700 hover:border-yellow-500 transition-all 
                  duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={
                        request.recipient.profilePicture ||
                        "/default-avatar.png"
                      }
                      alt={request.recipient.name}
                      className="w-16 h-16 rounded-full border-2 border-yellow-500 
                        ring-2 ring-offset-2 ring-offset-gray-800 ring-yellow-500"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-yellow-300">
                      {request.recipient.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {request.recipient.headline || "No headline"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="mr-1">🔗</span>
                      {request.recipient.connections.length} connections
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    disabled
                    className="bg-yellow-500/20 text-yellow-300 
                      p-2 rounded-full border border-yellow-500 cursor-not-allowed 
                      opacity-70 flex items-center space-x-2"
                  >
                    <Clock className="w-6 h-6" />
                    <span>Pending</span>
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

export default RequestSent;
