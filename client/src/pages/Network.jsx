import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Network = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    clg: "",
    skills: "",
    project: "",
    company: "",
  });
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [connectionStatuses, setConnectionStatuses] = useState({});

  useEffect(() => {
    // Fetch suggested connections from the backend
    axios
      .get("/api/v1/user/usersuggestions")
      .then((response) => {
        setSuggestedUsers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching suggested users:", error);
      });
  }, []);

  // Function to check connection status for multiple users
  const fetchConnectionStatuses = async (userIds) => {
    try {
      const statuses = {};
      for (const userId of userIds) {
        const response = await axios.get(
          `/api/v1/connections/${userId}/status`
        );
        statuses[userId] = response.data.status;
      }
      setConnectionStatuses(statuses);
    } catch (error) {
      console.error("Error fetching connection statuses:", error);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Fetch all users
      const usersResponse = await axios.get("/api/v1/user/getallusers");

      // Filter users based on search term (username or name)
      const filteredUsers = usersResponse.data.filter(
        (user) =>
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.name.toLowerCase().includes(search.toLowerCase())
      );

      // Set search results
      setSearchResults(filteredUsers);

      // Fetch connection statuses for found users
      if (filteredUsers.length > 0) {
        fetchConnectionStatuses(filteredUsers.map((user) => user._id));
      }
    } catch (error) {
      console.error("Error searching users:", error);
      alert("Failed to search users");
    }
  };

  const handleConnect = async (userId) => {
    try {
      const response = await axios.post(
        `/api/v1/connections/${userId}/request`
      );

      // Update connection status
      setConnectionStatuses((prev) => ({
        ...prev,
        [userId]: "pending",
      }));

      alert(response.data.message);
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert(
        error.response?.data?.message || "Failed to send connection request"
      );
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleProfileClick = (name) => {
    const formattedName = name.replace(/\s+/g, "-").toLowerCase();
    navigate(`/profile/${formattedName}`);
  };

  const userStats = [
    { title: "Connections", count: 120 },
    { title: "Requests Sent", count: 15 },
    { title: "Discussions Participated", count: 8 },
    { title: "Communities Joined", count: 5 },
    { title: "My Posts", count: 3 },
    { title: "Posts Liked", count: 24 },
    { title: "Requests Pending", count: 0 },
    { title: "Profile Views", count: 1 },
  ];

  const handleStatClick = (title) => {
    switch (title) {
      case "Connections":
        navigate("/connections");
        break;
      case "Requests Sent":
        navigate("/connections/requests-sent");
        break;
      case "Discussions Participated":
        navigate("/discussionsjoined");
        break;
      case "Communities Joined":
        navigate("/communitiesjoined");
        break;
      case "My Posts":
        navigate("/posts");
        break;
      case "Posts Liked":
        navigate("/posts/liked");
        break;
      case "Requests Pending":
        navigate("/connections/pending-requests");
        break;
      case "Profile Views":
        navigate("/profile/views");
        break;
      default:
        break;
    }
  };

  const renderConnectionButton = (user) => {
    const status = connectionStatuses[user._id];

    switch (status) {
      case "connected":
        return (
          <button
            disabled
            className="px-4 py-2 border border-green-700 text-green-700 rounded-lg cursor-not-allowed"
          >
            Connected
          </button>
        );
      case "pending":
        return (
          <button
            disabled
            className="px-4 py-2 border border-yellow-500 text-yellow-500 rounded-lg cursor-not-allowed"
          >
            Pending
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleConnect(user._id)}
            className="px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition duration-300"
          >
            Connect
          </button>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-6 bg-gray-900 text-gray-200">
      {/* Search Bar & Filter Button */}
      <div className="mb-6 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search connections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleSearch}
          className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Filter
        </button>
      </div>

      {/* Filter Options */}
      {showFilter && (
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          {/* Filter inputs remain the same */}
        </div>
      )}

      {/* Search Results Section - Added just before existing content */}
      {searchResults.length > 0 && (
        <div className="mb-6 bg-gray-800 p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Search Results</h2>
          <div className="grid grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <button onClick={() => handleProfileClick(user.name)}>
                    <img
                      src={user.profilePicture || "/default-avatar.png"}
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-3 cursor-pointer"
                    />
                  </button>
                  <div>
                    <p className="text-md font-bold cursor-pointer hover:text-green-400">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                </div>
                {renderConnectionButton(user)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-grow">
        {/* Left Section - User Stats */}
        <div className="w-3/5 grid grid-cols-2 gap-4">
          {userStats.map((stat, index) => (
            <div
              key={index}
              onClick={() => handleStatClick(stat.title)}
              className="bg-gray-800 p-6 rounded-xl shadow-md hover:bg-green-600 transition duration-300 cursor-pointer text-center"
            >
              <h2 className="text-lg font-semibold">{stat.title}</h2>
              <p className="text-3xl font-bold mt-1">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Right Section - Suggested Users */}
        <div className="w-2/5 bg-gray-800 p-4 rounded-xl shadow-md ml-4">
          <h2 className="text-lg font-semibold mb-3">Suggested Connections</h2>
          <ul>
            {suggestedUsers.map((user) => (
              <li
                key={user._id}
                className="mb-3 p-3 bg-gray-700 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center">
                  <button onClick={() => handleProfileClick(user.name)}>
                    <img
                      src={user.img}
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-3 cursor-pointer"
                    />
                  </button>
                  <button
                    onClick={() => handleProfileClick(user.username)}
                    className="text-left"
                  >
                    <p className="text-md font-bold cursor-pointer hover:text-green-400">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                  </button>
                </div>
                <button
                  onClick={() => handleConnect(user._id)}
                  className="px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition duration-300"
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Network;
