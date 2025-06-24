import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// Initialize socket instance outside the component
let socket;

const Discussion = () => {
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [conversationExists, setConversationExists] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
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
    const SOCKET_URL = window.location.origin; // Backend socket URL

    socket = io(SOCKET_URL);

    // Handle socket connection
    socket.on("connected", () => {
      console.log("Connected to socket.io server");
    });

    // Clean up socket connection when component unmounts
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

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (newMessageReceived) => {
      console.log("New message received:", newMessageReceived);

      // Handle typing indicator
      setIsTyping(false);

      // Only update messages if the sender is the currently selected user
      if (selectedUser && newMessageReceived.sender._id === selectedUser._id) {
        setMessages((prevMessages) => [
          ...prevMessages,
          newMessageReceived.message,
        ]);

        // Set conversation as existing since we received a message
        setConversationExists(true);

        // Update connections list with last message
        updateConnectionWithLastMessage(
          newMessageReceived.sender._id,
          newMessageReceived.message.content,
          newMessageReceived.sender.name
        );
      } else {
        // Update connections list with notification for unread message
        updateConnectionWithLastMessage(
          newMessageReceived.sender._id,
          newMessageReceived.message.content,
          newMessageReceived.sender.name,
          true // Mark as unread
        );
      }
    });

    // Typing indicators
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop-typing", () => setIsTyping(false));

    // Clean up event listeners
    return () => {
      socket.off("receive-message");
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, [selectedUser]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Using the cookie for authentication
        const response = await axios.get("/api/v1/auth/me");
        setCurrentUserId(response.data.user._id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch user connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        // Using cookie for authentication instead of Authorization header
        const response = await axios.get("/api/v1/connections");

        const fetchedConnections = response.data;
        setConnections(fetchedConnections);

        // Set first connection as selected if connections exist
        if (fetchedConnections.length > 0) {
          setSelectedUser(fetchedConnections[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching connections:", error);
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  // Fetch messages when selected user changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        // Using cookie for authentication instead of Authorization header
        const response = await axios.get(
          `/api/v1/conversation/messages/${selectedUser._id}`
        );

        setMessages(response.data);
        setConversationExists(response.data.length > 0);

        // Join the chat room when user is selected
        if (socket && selectedUser && currentUserId) {
          // Create a unique room ID using both user IDs (sorted to ensure consistency)
          const roomId = [currentUserId, selectedUser._id].sort().join("_");
          console.log("Attempting to join room:", roomId);

          // Always join the room when selecting a user
          socket.emit("join-chat", roomId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        // If the error is due to no conversation existing
        if (error.response && error.response.status === 404) {
          setMessages([]);
          setConversationExists(false);
        }
      }
    };

    if (selectedUser && currentUserId) {
      fetchMessages();
    }
  }, [selectedUser, currentUserId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket || !selectedUser || !currentUserId) return;

    if (!typing) {
      setTyping(true);
      // Create a unique room ID using both user IDs (sorted to ensure consistency)
      const roomId = [currentUserId, selectedUser._id].sort().join("_");
      socket.emit("typing", roomId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (currentUserId && selectedUser) {
        const roomId = [currentUserId, selectedUser._id].sort().join("_");
        socket.emit("stop-typing", roomId);
        setTyping(false);
      }
    }, 3000);
  };

  // Update connection with last message
  const updateConnectionWithLastMessage = (
    userId,
    text,
    sender,
    unread = false
  ) => {
    setConnections((prevConnections) => {
      return prevConnections.map((conn) => {
        if (conn._id === userId) {
          return {
            ...conn,
            lastMessage: {
              text: text,
              sender: sender,
              timestamp: new Date(),
            },
            unread: unread,
          };
        }
        return conn;
      });
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId) return;

    try {
      // Stop typing indicator
      if (socket && selectedUser) {
        const roomId = [currentUserId, selectedUser._id].sort().join("_");
        socket.emit("stop-typing", roomId);
      }

      console.log("Sending message to:", selectedUser._id);

      // Using cookie for authentication instead of Authorization header
      const response = await axios.post(
        `/api/v1/conversation/send/${selectedUser._id}`,
        { message: newMessage }
      );

      console.log("Message sent successfully:", response.data);

      // Add the new message to the messages array
      setMessages((prevMessages) => [...prevMessages, response.data]);

      // Set conversation as existing since we just sent a message
      setConversationExists(true);

      // Create room ID
      const roomId = [currentUserId, selectedUser._id].sort().join("_");

      // Always join the room before sending a message
      if (socket) {
        socket.emit("join-chat", roomId);

        // Emit socket event for real-time message
        socket.emit("send-message", {
          message: response.data,
          receiverId: selectedUser._id,
          sender: {
            _id: currentUserId,
            name: response.data.sender.name || "You",
            profilePicture: response.data.sender.profilePicture || "",
          },
          roomId: roomId,
        });
      }

      // Clear input
      setNewMessage("");

      // Update the connections list with last message
      updateConnectionWithLastMessage(selectedUser._id, newMessage, "You");
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle specific error cases
      if (error.response) {
        console.error(
          "Server responded with:",
          error.response.status,
          error.response.data
        );
      }
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

  // Navigation handlers
  const navigateTo = (path) => {
    window.location.href = path;
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex h-screen w-screen text-white p-6 gap-6 bg-gray-900">
      {/* Connections List */}
      <div className="w-1/3 bg-gray-800 p-6 rounded-2xl shadow-lg h-full overflow-y-auto custom-scrollbar border border-green-500/30">
        {/* Dropdown Navigation Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-2xl font-bold mb-6 text-green-400 flex items-center justify-between w-full py-2 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <div className="flex items-center">
              <span className="mr-2 w-3 h-3 bg-green-500 rounded-full inline-block"></span>
              Connections
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
        ) : connections.length === 0 ? (
          <p className="text-gray-400 bg-gray-800/50 p-4 rounded-lg text-center">
            No connections found
          </p>
        ) : (
          <div className="space-y-2">
            {connections.map((connection) => (
              <div
                key={connection._id}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gray-700 backdrop-blur-sm ${
                  selectedUser?._id === connection._id
                    ? "bg-gray-700/90 border-l-4 border-green-500"
                    : "bg-gray-800/80"
                }`}
                onClick={() => {
                  setSelectedUser(connection);
                  // Clear unread status when selecting a user
                  if (connection.unread) {
                    setConnections((prevConnections) =>
                      prevConnections.map((conn) =>
                        conn._id === connection._id
                          ? { ...conn, unread: false }
                          : conn
                      )
                    );
                  }
                }}
              >
                <div className="relative">
                  <img
                    src={
                      connection.profilePicture ||
                      "https://via.placeholder.com/50"
                    }
                    alt={connection.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-lg text-green-100">
                      {connection.name}
                    </p>
                    {connection.unread && (
                      <span className="bg-green-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">
                        !
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {connection.headline || connection.username}
                  </p>
                  {connection.lastMessage ? (
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {connection.lastMessage.sender === "You"
                        ? "You: "
                        : `${connection.name}: `}
                      {connection.lastMessage.text}
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

      {/* Conversation */}
      {selectedUser ? (
        <div className="w-2/3 flex flex-col h-full rounded-2xl overflow-hidden backdrop-blur-sm border border-green-500/30 bg-gradient-to-b from-gray-800 to-gray-900">
          {/* Chat Header */}
          <div className="p-5 bg-gray-800/90 border-b border-green-500/20 flex items-center gap-4 backdrop-blur-sm">
            <div className="relative">
              <img
                src={
                  selectedUser.profilePicture ||
                  "https://via.placeholder.com/50"
                }
                alt={selectedUser.name}
                className="w-12 h-12 rounded-full border-2 border-green-500/30"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
            </div>
            <div>
              <p className="text-xl font-semibold text-green-100">
                {selectedUser.name}
              </p>
              <p className="text-sm text-gray-400">
                {selectedUser.headline || selectedUser.username}
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 h-[calc(100vh-150px)] bg-gray-900/80 custom-scrollbar">
            {!conversationExists ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-400 bg-gray-800/30 px-8 py-4 rounded-full backdrop-blur-sm">
                  No conversation yet. Start messaging with {selectedUser.name}!
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  // Direct comparison to determine if message is from current user
                  const senderIsCurrentUser = msg.sender._id === currentUserId;

                  return (
                    <div
                      key={msg._id || `temp-${index}`}
                      className={`flex ${
                        senderIsCurrentUser ? "justify-end" : "justify-start"
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
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex-shrink-0 mr-3">
                      <img
                        src={
                          selectedUser.profilePicture ||
                          "https://via.placeholder.com/40"
                        }
                        alt={selectedUser.name}
                        className="w-8 h-8 rounded-full"
                      />
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

          {/* Chat Input */}
          <div className="p-5 bg-gray-800/90 flex items-center gap-4 border-t border-green-500/20 backdrop-blur-sm">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={`Message ${selectedUser.name}...`}
              className="flex-1 p-4 bg-gray-700/70 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all hover:shadow-lg hover:shadow-green-500/20"
              disabled={!newMessage.trim()}
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
            Select a connection to start chatting
          </p>
        </div>
      )}

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

export default Discussion;
