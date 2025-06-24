import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`/api/v1/user/${username}`);
        console.log(response.data);
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (loading) return <div className="text-center text-white">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-gray-200">
      {/* Banner Image */}
      <div className="w-full h-56 bg-gray-800 relative">
        <img
          src={user.bannerImg || "https://via.placeholder.com/1200x300"}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>

      {/* Profile Content */}
      <div className="w-full max-w-4xl p-6 flex flex-col items-center">
        {/* Profile Picture */}
        <img
          src={user.profilePicture || "https://via.placeholder.com/150"}
          alt={user.name}
          className="w-32 h-32 rounded-full border-4 border-green-600 -mt-16 shadow-lg"
        />

        {/* Name and Headline */}
        <h1 className="text-3xl font-bold mt-4">{user.name}</h1>
        <p className="text-green-400 text-lg">
          {user.headline || "No headline available"}
        </p>
        <p className="text-gray-400 text-sm">@{user.username}</p>

        {/* About Section */}
        <p className="mt-4 text-center text-gray-300">
          {user.about || "No about section provided."}
        </p>

        {/* User Details */}
        <div className="w-full mt-6 bg-gray-800 p-6 rounded-lg shadow-md grid gap-6">
          {/* Basic Details */}
          <div>
            <h2 className="text-xl font-semibold text-green-500">
              Basic Information
            </h2>
            <p>
              <strong>Email:</strong> {user.email || "Not provided"}
            </p>
            <p>
              <strong>Location:</strong> {user.location || "Unknown"}
            </p>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xl font-semibold text-green-500">Skills</h2>
            {user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-green-600 text-white px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p>No skills added.</p>
            )}
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-xl font-semibold text-green-500">Projects</h2>
            {user.projects.length > 0 ? (
              <ul className="list-disc pl-5">
                {user.projects.map((project, index) => (
                  <li key={index}>{project}</li>
                ))}
              </ul>
            ) : (
              <p>No projects added.</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-xl font-semibold text-green-500">Experience</h2>
            {user.experience.length > 0 ? (
              <ul className="list-disc pl-5">
                {user.experience.map((exp, index) => (
                  <li key={index}>{exp}</li>
                ))}
              </ul>
            ) : (
              <p>No experience added.</p>
            )}
          </div>

          {/* Connections */}
          <div>
            <h2 className="text-xl font-semibold text-green-500">
              Connections
            </h2>
            <p>{user.connections.length} connections</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
