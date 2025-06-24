import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  UserMinus,
  UserPlus,
  Edit2,
  X,
  User,
  Users,
  Crown,
  Search,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const GroupSettings = () => {
  const { groupId } = useParams();
  const [groupDetails, setGroupDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [connections, setConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnections, setSelectedConnections] = useState([]);

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setIsLoading(true);
        // Fixed: Send groupId in the request body as expected by the backend
        const response = await axios.get(`/api/v1/grp/groupdetails/${groupId}`);
        setGroupDetails(response.data);
        setNewGroupName(response.data.name);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching group details:", error);
        setError(
          error.response?.data?.error || "Failed to fetch group details"
        );
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  // Fetch user connections when add members modal is opened
  useEffect(() => {
    if (showAddMembers) {
      const fetchConnections = async () => {
        try {
          const response = await axios.get("/api/v1/connections");
          setConnections(response.data);
        } catch (error) {
          console.error("Error fetching connections:", error);
        }
      };

      fetchConnections();
    }
  }, [showAddMembers]);

  // Handle removing a participant
  const handleRemoveParticipant = async (participantId) => {
    try {
      const confirmRemove = window.confirm(
        "Are you sure you want to remove this participant?"
      );

      if (!confirmRemove) return;

      await axios.delete(
        `/api/v1/grp/group/${groupId}/participants/${participantId}`
      );

      // Update local state to reflect the change
      setGroupDetails((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p._id !== participantId),
        participantCount: prev.participantCount - 1,
      }));
    } catch (error) {
      console.error("Error removing participant:", error);
      alert(error.response?.data?.error || "Failed to remove participant");
    }
  };

  // Handle adding participants
  const handleAddParticipants = async () => {
    if (selectedConnections.length === 0) {
      alert("Please select at least one connection to add");
      return;
    }

    try {
      await axios.post(`/api/v1/grp/group/${groupId}/participants`, {
        participants: selectedConnections.map((conn) => conn._id),
      });

      // Close modal and reset selections
      setShowAddMembers(false);
      setSelectedConnections([]);
      // Refresh group details to show new participants
      const updatedDetails = await axios.get(
        `/api/v1/grp/groupdetails/${groupId}`
      );

      setGroupDetails(updatedDetails.data);
      toast.success("Participants added successfully");
    } catch (error) {
      console.error("Error adding participants:", error);
      toast.error(error.response?.data?.error || "Failed to add participants");
    }
  };

  // Handle updating group name
  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim()) {
      alert("Group name cannot be empty");
      return;
    }

    try {
      await axios.put(`/api/v1/grp/group/${groupId}`, {
        groupName: newGroupName,
      });

      // Update local state
      setGroupDetails((prev) => ({
        ...prev,
        name: newGroupName,
      }));

      setShowEditName(false);
    } catch (error) {
      console.error("Error updating group name:", error);
      alert(error.response?.data?.error || "Failed to update group name");
    }
  };

  // Toggle selection of a connection
  const toggleConnectionSelection = (connection) => {
    if (selectedConnections.some((conn) => conn._id === connection._id)) {
      setSelectedConnections(
        selectedConnections.filter((conn) => conn._id !== connection._id)
      );
    } else {
      setSelectedConnections([...selectedConnections, connection]);
    }
  };

  // Filter connections based on search term and exclude current participants
  const filteredConnections = connections.filter((conn) => {
    // Make sure groupDetails exists before trying to access its properties
    const isAlreadyParticipant = groupDetails?.participants?.some(
      (p) => p._id === conn._id
    );
    const matchesSearch =
      conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && !isAlreadyParticipant;
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Loading Group Settings...
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

  // Make sure groupDetails exists before rendering
  if (!groupDetails) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <div className="max-w-4xl mx-auto text-center text-yellow-500">
          No group details found
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Group Name Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              {groupDetails.name}
            </h1>

            {groupDetails.isAdmin && !showEditName && (
              <button
                onClick={() => setShowEditName(true)}
                className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 
                  p-2 rounded-full border border-blue-500 transition-all 
                  hover:scale-110"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Edit Group Name Form */}
          {showEditName && (
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 flex-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter new group name"
              />
              <button
                onClick={handleUpdateGroupName}
                className="bg-green-500/20 hover:bg-green-500/40 text-green-300 
                  p-2 rounded-full border border-green-500 transition-all"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowEditName(false);
                  setNewGroupName(groupDetails.name);
                }}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-300 
                  p-2 rounded-full border border-red-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="text-gray-400 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>{groupDetails.participantCount} participants</span>
          </div>

          {groupDetails.lastMessage && (
            <div className="mt-2 text-sm text-gray-500">
              <span>Last activity: </span>
              {groupDetails.lastMessage.isSystemMessage ? (
                <span>{groupDetails.lastMessage.text}</span>
              ) : (
                <span>
                  {groupDetails.lastMessage.sender}:{" "}
                  {groupDetails.lastMessage.text}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-400">Participants</h2>

            {groupDetails.isAdmin && (
              <button
                onClick={() => setShowAddMembers(true)}
                className="bg-green-500/20 hover:bg-green-500/40 text-green-300 
                  px-3 py-2 rounded-lg border border-green-500 transition-all 
                  flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add Members
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Admin */}
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={
                      groupDetails.admin.profilePicture || "/default-avatar.png"
                    }
                    alt={groupDetails.admin.name}
                    className="w-12 h-12 rounded-full border-2 border-yellow-500"
                  />
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-gray-900 rounded-full p-1">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-yellow-300">
                    {groupDetails.admin.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {groupDetails.admin.headline ||
                      `@${groupDetails.admin.username}`}
                  </p>
                </div>
              </div>
              <div className="text-yellow-500 font-medium text-sm">Admin</div>
            </div>

            {/* Other Participants */}
            {groupDetails.participants
              .filter((p) => p._id !== groupDetails.admin._id)
              .map((participant) => (
                <div
                  key={participant._id}
                  className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between 
                    hover:bg-gray-700/50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={
                          participant.profilePicture || "/default-avatar.png"
                        }
                        alt={participant.name}
                        className="w-12 h-12 rounded-full border border-gray-600"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                        <User className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-300">
                        {participant.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {participant.headline || `@${participant.username}`}
                      </p>
                    </div>
                  </div>

                  {groupDetails.isAdmin && (
                    <button
                      onClick={() => handleRemoveParticipant(participant._id)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-300 
                        p-2 rounded-full border border-red-500 transition-all 
                        hover:scale-110"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-400">
                Add Group Members
              </h2>
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedConnections([]);
                  setSearchTerm("");
                }}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-300 
                  p-2 rounded-full border border-red-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 
                  pl-10 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
            </div>

            {/* Connections List */}
            <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
              {filteredConnections.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm
                    ? "No matching connections found"
                    : "No available connections"}
                </div>
              ) : (
                filteredConnections.map((connection) => (
                  <div
                    key={connection._id}
                    onClick={() => toggleConnectionSelection(connection)}
                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer
                      ${
                        selectedConnections.some(
                          (conn) => conn._id === connection._id
                        )
                          ? "bg-blue-500/30 border-blue-500"
                          : "bg-gray-700/50 hover:bg-gray-700 border-transparent"
                      }
                      border transition-all`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={connection.profilePicture || "/default-avatar.png"}
                        alt={connection.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-medium text-blue-300">
                          {connection.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {connection.headline || `@${connection.username}`}
                        </p>
                      </div>
                    </div>

                    {selectedConnections.some(
                      (conn) => conn._id === connection._id
                    ) && (
                      <div className="bg-blue-500 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedConnections([]);
                }}
                className="px-4 py-2 rounded-lg border border-gray-500 text-gray-300 
                  hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipants}
                disabled={selectedConnections.length === 0}
                className={`px-4 py-2 rounded-lg flex items-center
                  ${
                    selectedConnections.length === 0
                      ? "bg-blue-800/40 text-blue-300/50 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }
                  transition-all`}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add{" "}
                {selectedConnections.length > 0
                  ? `(${selectedConnections.length})`
                  : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSettings;
