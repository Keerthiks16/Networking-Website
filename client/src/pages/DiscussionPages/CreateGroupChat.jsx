import React, { useState, useEffect } from "react";
import axios from "axios";

const CreateGroupChat = ({ onChatCreated }) => {
  const [name, setName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userConnections, setUserConnections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user connections on component mount
  useEffect(() => {
    fetchUserConnections();
  }, []);

  // Fetch user connections from the backend
  const fetchUserConnections = async () => {
    try {
      const response = await axios.get("/api/v1/connections");
      setUserConnections(response.data);
    } catch (error) {
      console.error("Error fetching user connections:", error);
      setError("Failed to load connections. Please refresh the page.");
    }
  };

  // Filter users based on search input
  useEffect(() => {
    if (userSearch.trim()) {
      const filtered = userConnections.filter((user) =>
        user.username.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [userSearch, userConnections]);

  // Add participant to the participants array
  const addParticipant = (user) => {
    if (!participants.some((p) => p._id === user._id)) {
      setParticipants([
        ...participants,
        {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        },
      ]);
      setUserSearch("");
    }
  };

  // Remove participant from the array
  const removeParticipant = (userId) => {
    setParticipants(participants.filter((p) => p._id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || participants.length < 2) {
      setError("Group name and at least 2 participants are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Transform participants array to only contain _id values
      const participantIds = participants.map((p) => p._id);

      const groupData = {
        name,
        participants: participantIds,
        initialMessage: initialMessage.trim() ? initialMessage : undefined,
      };

      const response = await axios.post("/api/v1/grp/group", groupData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setName("");
        setInitialMessage("");
        setParticipants([]);
        if (onChatCreated) onChatCreated(response.data);
      }
    } catch (err) {
      setError("Failed to create group chat. Try again.");
      console.error("Group chat creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        Create a Group Chat
      </h2>
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Name */}
        <div>
          <label className="block text-gray-300 mb-2">Group Name</label>
          <input
            type="text"
            placeholder="Enter group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-gray-700 text-gray-300 rounded-lg"
            required
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-gray-300 mb-2">Participants</label>
          <div className="flex mb-2 relative">
            <input
              type="text"
              placeholder="Search for connections"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="flex-grow p-2 bg-gray-700 text-gray-300 rounded-lg"
            />
            {filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-700 mt-1 rounded-lg max-h-40 overflow-y-auto z-10">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="p-2 hover:bg-gray-600 cursor-pointer flex items-center"
                    onClick={() => addParticipant(user)}
                  >
                    {user.profilePicture && (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                    )}
                    <div>
                      <div className="text-white">{user.username}</div>
                      {user.headline && (
                        <div className="text-gray-400 text-sm">
                          {user.headline}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Participants */}
          <div className="mt-3 mb-2">
            <p className="text-gray-400 text-sm">
              {participants.length}{" "}
              {participants.length === 1 ? "participant" : "participants"}{" "}
              selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {participants.map((participant) => (
              <div
                key={participant._id}
                className="bg-gray-600 text-white px-3 py-1 rounded-full flex items-center"
              >
                {participant.profilePicture && (
                  <img
                    src={participant.profilePicture}
                    alt={participant.username}
                    className="w-5 h-5 rounded-full mr-1 object-cover"
                  />
                )}
                {participant.username}
                <button
                  type="button"
                  onClick={() => removeParticipant(participant._id)}
                  className="ml-2 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Initial Message */}
        <div>
          <label className="block text-gray-300 mb-2">
            Initial Message (Optional)
          </label>
          <textarea
            placeholder="Send a message to start the conversation"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg resize-none h-24"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? "Creating Group..." : "Create Group Chat"}
        </button>
      </form>
    </div>
  );
};

export default CreateGroupChat;
