import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

let socket;

const GroupDiscussion = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = window.location.origin;
    socket = io(SOCKET_URL);

    socket.on("connected", () => {
      console.log("Connected to socket.io server");
    });

    return () => {
      console.log("Disconnecting socket");
      if (socket) socket.disconnect();
    };
  }, []);

  // Setup user in socket when currentUserId is available
  useEffect(() => {
    if (!currentUserId) return;

    socket.on("connect", () => {
      console.log("Setting up user:", currentUserId);
      socket.emit("setup", currentUserId);
    });

    if (socket.connected) {
      console.log("Socket already connected, setting up user:", currentUserId);
      socket.emit("setup", currentUserId);
    }
  }, [currentUserId]);

  // Listen for incoming group messages and events
  useEffect(() => {
    if (!socket) return;

    // Handle new group messages
    socket.on("newGroupMessage", (data) => {
      console.log("New group message received:", data);

      if (selectedGroup && data.conversationId === selectedGroup.id) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
        updateGroupWithLastMessage(data.conversationId, data.message.content);
      } else {
        // Update groups list with notification for unread message
        updateGroupWithLastMessage(
          data.conversationId,
          data.message.content,
          true
        );
      }
    });

    // Handle group updates (participants added/removed, name changes)
    socket.on("groupUpdated", (updatedGroup) => {
      console.log("Group updated:", updatedGroup);

      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === updatedGroup._id.toString()
            ? {
                ...group,
                name: updatedGroup.groupName,
                participants: updatedGroup.participants,
                admin: updatedGroup.groupAdmin,
              }
            : group
        )
      );

      if (selectedGroup && selectedGroup.id === updatedGroup._id.toString()) {
        setGroupParticipants(updatedGroup.participants);
        setIsAdmin(updatedGroup.groupAdmin._id.toString() === currentUserId);
      }
    });

    // Handle typing indicators in group
    socket.on("groupTyping", (data) => {
      if (selectedGroup && data.groupId === selectedGroup.id) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    });

    socket.on("groupStopTyping", (data) => {
      if (selectedGroup && data.groupId === selectedGroup.id) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    });

    // Clean up event listeners
    return () => {
      socket.off("newGroupMessage");
      socket.off("groupUpdated");
      socket.off("groupTyping");
      socket.off("groupStopTyping");
    };
  }, [selectedGroup, currentUserId]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("/api/v1/auth/me");
        setCurrentUserId(response.data.user._id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch user groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/v1/grp/groups");
        setGroups(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user groups:", error);
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchUserGroups();
    }
  }, [currentUserId]);

  // Fetch group messages when selected group changes
  useEffect(() => {
    const fetchGroupMessages = async () => {
      if (!selectedGroup) return;

      try {
        const response = await axios.get(
          `/api/v1/grp/group/${selectedGroup.id}/messages`
        );

        setMessages(response.data.messages);
        setGroupParticipants(response.data.participants);
        setIsAdmin(response.data.isAdmin);

        // Join the group chat room
        if (socket && selectedGroup && currentUserId) {
          socket.emit("joinGroup", selectedGroup.id);
        }
      } catch (error) {
        console.error("Error fetching group messages:", error);
        setMessages([]);
      }
    };

    if (selectedGroup && currentUserId) {
      fetchGroupMessages();
    }
  }, [selectedGroup, currentUserId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Update group with last message
  const updateGroupWithLastMessage = (groupId, text, unread = false) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            lastMessage: {
              text: text,
              timestamp: new Date(),
            },
            unread: unread,
          };
        }
        return group;
      })
    );
  };

  // Handle typing in group
  const handleTyping = () => {
    if (!socket || !selectedGroup || !currentUserId) return;

    // Emit typing event
    socket.emit("groupTyping", {
      groupId: selectedGroup.id,
      userId: currentUserId,
    });

    // Clear previous timeout if exists
    const timer = setTimeout(() => {
      socket.emit("groupStopTyping", {
        groupId: selectedGroup.id,
        userId: currentUserId,
      });
    }, 3000);

    return () => clearTimeout(timer);
  };

  // Send group message
  const sendGroupMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !currentUserId) return;

    try {
      // Stop typing indicator
      socket.emit("groupStopTyping", {
        groupId: selectedGroup.id,
        userId: currentUserId,
      });

      const response = await axios.post(
        `/api/v1/grp/group/${selectedGroup.id}/message`,
        { message: newMessage }
      );

      // Add the new message to the messages array
      setMessages((prevMessages) => [...prevMessages, response.data]);

      // Update the groups list with last message
      updateGroupWithLastMessage(selectedGroup.id, newMessage);

      // Clear input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending group message:", error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for message grouping
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped = {};
    messages.forEach((message) => {
      const date = formatDate(message.timestamp);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    return grouped;
  };

  // Navigation handlers
  const navigateTo = (path) => {
    window.location.href = path;
    setIsDropdownOpen(false);
  };

  // Navigate to edit conversation
  const navigateToEditConversation = () => {
    if (selectedGroup && selectedGroup.id) {
      window.location.href = `/editconversation/${selectedGroup.id}`;
    }
  };

  // Navigate to create group
  const navigateToCreateGroup = () => {
    window.location.href = "/creategroup";
  };

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="flex h-screen w-screen text-white p-6 gap-6 bg-gray-900">
      {/* Groups List */}
      <div className="w-1/3 bg-gray-800 p-6 rounded-2xl shadow-lg h-full overflow-y-auto custom-scrollbar border border-green-500/30">
        {/* Dropdown Navigation Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-2xl font-bold mb-6 text-green-400 flex items-center justify-between w-full py-2 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <div className="flex items-center">
              <span className="mr-2 w-3 h-3 bg-green-500 rounded-full inline-block"></span>
              Group Chats
            </div>
            <svg
              className={`w-5 h-5 text-green-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full bg-gray-700 rounded-lg shadow-lg border border-green-500/30 py-1 backdrop-blur-sm">
              <button
                className="flex items-center px-4 py-3 text-sm text-white hover:bg-gray-600 w-full text-left"
                onClick={() => navigateTo("/discussion")}
              >
                <svg
                  className="w-5 h-5 mr-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
                Connections
              </button>
              <button
                className="flex items-center px-4 py-3 text-sm text-white hover:bg-gray-600 w-full text-left"
                onClick={() => navigateTo("/groupdiscussion")}
              >
                <svg
                  className="w-5 h-5 mr-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  ></path>
                </svg>
                Group Discussions
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-gray-400 bg-gray-800/50 p-4 rounded-lg text-center">
            You're not in any groups yet
          </p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gray-700 backdrop-blur-sm ${
                  selectedGroup?.id === group.id
                    ? "bg-gray-700/90 border-l-4 border-green-500"
                    : "bg-gray-800/80"
                }`}
                onClick={() => {
                  setSelectedGroup(group);
                  // Clear unread status when selecting a group
                  if (group.unread) {
                    setGroups((prevGroups) =>
                      prevGroups.map((g) =>
                        g.id === group.id ? { ...g, unread: false } : g
                      )
                    );
                  }
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center border-2 border-green-500/30">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-lg text-green-100">
                      {group.name}
                    </p>
                    {group.unread && (
                      <span className="bg-green-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">
                        !
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {group.participants.length} members
                  </p>
                  {group.lastMessage ? (
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {group.lastMessage.text}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">
                      No messages yet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Conversation */}
      {selectedGroup ? (
        <div className="w-2/3 flex flex-col h-full rounded-2xl overflow-hidden backdrop-blur-sm border border-green-500/30 bg-gradient-to-b from-gray-800 to-gray-900">
          {/* Group Chat Header */}
          <div className="p-5 bg-gray-800/90 border-b border-green-500/20 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center border-2 border-green-500/30">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z"></path>
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
              </div>
              <div>
                <p className="text-xl font-semibold text-green-100">
                  {selectedGroup.name}
                </p>
                <p className="text-sm text-gray-400">
                  {groupParticipants.length} members •{" "}
                  {isAdmin
                    ? "You are admin"
                    : `Admin: ${selectedGroup.admin?.name || "Unknown"}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-all"
                onClick={navigateToEditConversation}
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Group Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 h-[calc(100vh-150px)] bg-gray-900/80 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-400 bg-gray-800/30 px-6 py-4 rounded-full backdrop-blur-sm">
                  No messages yet in {selectedGroup.name}. Start the
                  conversation!
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <React.Fragment key={date}>
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-700/50 text-gray-400 text-xs px-3 py-1 rounded-full">
                        {date}
                      </div>
                    </div>
                    {dateMessages.map((msg) => {
                      const senderIsCurrentUser =
                        msg.sender._id === currentUserId;
                      const isSystemMessage = msg.isSystemMessage;

                      if (isSystemMessage) {
                        return (
                          <div
                            key={msg._id}
                            className="flex justify-center mb-4"
                          >
                            <div className="bg-gray-700/30 text-gray-400 text-sm px-4 py-2 rounded-full">
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg._id}
                          className={`flex ${
                            senderIsCurrentUser
                              ? "justify-end"
                              : "justify-start"
                          } mb-4`}
                        >
                          {!senderIsCurrentUser && (
                            <div className="flex-shrink-0 mr-3">
                              <img
                                src={
                                  msg.sender.profilePicture ||
                                  "https://via.placeholder.com/40"
                                }
                                alt={msg.sender.name}
                                className="w-8 h-8 rounded-full"
                              />
                            </div>
                          )}
                          <div
                            className={`p-4 max-w-md shadow-lg ${
                              senderIsCurrentUser
                                ? "bg-green-600/90 rounded-2xl rounded-tr-none text-white"
                                : "bg-gray-700/90 rounded-2xl rounded-tl-none text-white"
                            }`}
                          >
                            {!senderIsCurrentUser && (
                              <p className="text-xs font-semibold text-green-300 mb-1">
                                {msg.sender.name}
                              </p>
                            )}
                            <p className="text-base">{msg.content}</p>
                            <p className="text-xs text-gray-300/80 text-right mt-2 flex items-center justify-end gap-1">
                              {formatTime(msg.timestamp)}
                              {senderIsCurrentUser && (
                                <svg
                                  className="w-3 h-3 text-gray-300"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path>
                                </svg>
                              )}
                            </p>
                          </div>
                          {senderIsCurrentUser && (
                            <div className="flex-shrink-0 ml-3">
                              <img
                                src={
                                  msg.sender.profilePicture ||
                                  "https://via.placeholder.com/40"
                                }
                                alt="You"
                                className="w-8 h-8 rounded-full"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start mb-4">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="bg-gray-700/90 rounded-2xl rounded-tl-none text-white p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Group Chat Input */}
          <div className="p-5 bg-gray-800/90 flex items-center gap-4 border-t border-green-500/20 backdrop-blur-sm">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={`Message ${selectedGroup.name}...`}
              className="flex-1 p-4 bg-gray-700/70 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600"
              onKeyDown={(e) => e.key === "Enter" && sendGroupMessage()}
            />
            <button
              onClick={sendGroupMessage}
              className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all hover:shadow-lg hover:shadow-green-500/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-2/3 flex items-center justify-center bg-gray-800/50 rounded-2xl border border-green-500/30 backdrop-blur-sm">
          <p className="text-gray-400 bg-gray-800/80 px-8 py-4 rounded-full backdrop-blur-sm">
            Select a group to start chatting
          </p>
        </div>
      )}

      {/* Create Group Floating Button */}
      <button
        onClick={navigateToCreateGroup}
        className="fixed bottom-8 right-8 p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:shadow-xl hover:shadow-green-500/20 z-10"
        aria-label="Create new group"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          ></path>
        </svg>
      </button>

      {/* Custom Scrollbar Styling */}
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 31, 31, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }
        `}
      </style>
    </div>
  );
};

export default GroupDiscussion;
