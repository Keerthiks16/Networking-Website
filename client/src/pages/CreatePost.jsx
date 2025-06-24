import React, { useState, useEffect } from "react";
import axios from "axios";

const CreatePost = ({ onPostSuccess }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");

  // Contributors state
  const [contributors, setContributors] = useState([]);
  const [contributorSearch, setContributorSearch] = useState("");
  const [filteredContributors, setFilteredContributors] = useState([]);

  // Mentors state
  const [mentors, setMentors] = useState([]);
  const [mentorSearch, setMentorSearch] = useState("");
  const [filteredMentors, setFilteredMentors] = useState([]);

  // All users data
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all users on component mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Fetch all users from the backend
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get("/api/v1/user/getallusers");
      setAllUsers(response.data);
    } catch (error) {
      console.error("Error fetching all users:", error);
      setError("Failed to load users. Please refresh the page.");
    }
  };

  // Filter users based on contributor search input
  useEffect(() => {
    if (contributorSearch.trim()) {
      const filtered = allUsers.filter((user) =>
        user.username.toLowerCase().includes(contributorSearch.toLowerCase())
      );
      setFilteredContributors(filtered);
    } else {
      setFilteredContributors([]);
    }
  }, [contributorSearch, allUsers]);

  // Filter users based on mentor search input
  useEffect(() => {
    if (mentorSearch.trim()) {
      const filtered = allUsers.filter((user) =>
        user.username.toLowerCase().includes(mentorSearch.toLowerCase())
      );
      setFilteredMentors(filtered);
    } else {
      setFilteredMentors([]);
    }
  }, [mentorSearch, allUsers]);

  // Convert Image File to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Add skill to skills array
  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  // Add contributor to contributors array
  const addContributor = (user) => {
    if (!contributors.some((c) => c._id === user._id)) {
      setContributors([
        ...contributors,
        { _id: user._id, username: user.username },
      ]);
      setContributorSearch("");
    }
  };

  // Add mentor to mentors array
  const addMentor = (user) => {
    if (!mentors.some((m) => m._id === user._id)) {
      setMentors([...mentors, { _id: user._id, username: user.username }]);
      setMentorSearch("");
    }
  };

  // Remove contributor from array
  const removeContributor = (userId) => {
    setContributors(contributors.filter((c) => c._id !== userId));
  };

  // Remove mentor from array
  const removeMentor = (userId) => {
    setMentors(mentors.filter((m) => m._id !== userId));
  };

  // Remove skill from array
  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !image) {
      setError("Both content and image are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const base64Image = await convertToBase64(image); // Convert to base64

      // Transform contributors and mentors arrays to only contain _id values
      const contributorIds = contributors.map((c) => c._id);
      const mentorIds = mentors.map((m) => m._id);

      const postData = {
        content,
        image: base64Image,
        date,
        venue,
        skills,
        contributors: contributorIds, // Only storing IDs in the backend
        mentors: mentorIds, // Only storing IDs in the backend
      };

      const response = await axios.post("/api/v1/post/create", postData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setContent("");
        setImage(null);
        setPreview(null);
        setDate("");
        setVenue("");
        setSkills([]);
        setContributors([]);
        setMentors([]);
        if (onPostSuccess) onPostSuccess(response.data);
      }
    } catch (err) {
      setError("Failed to create post. Try again.");
      console.error("Post creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Create a Post</h2>
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Post Content */}
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg resize-none h-32"
          required
        />

        {/* Date */}
        <div>
          <label className="block text-gray-300 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 bg-gray-700 text-gray-300 rounded-lg"
          />
        </div>

        {/* Venue */}
        <div>
          <label className="block text-gray-300 mb-2">Venue</label>
          <input
            type="text"
            placeholder="Enter venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full p-2 bg-gray-700 text-gray-300 rounded-lg"
          />
        </div>

        {/* Skills/Keywords */}
        <div>
          <label className="block text-gray-300 mb-2">Skills/Keywords</label>
          <div className="flex mb-2">
            <input
              type="text"
              placeholder="Add a skill or keyword"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              className="flex-grow p-2 bg-gray-700 text-gray-300 rounded-l-lg"
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-green-600 text-white px-4 rounded-r-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-gray-600 text-white px-3 py-1 rounded-full flex items-center"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Contributors */}
        <div>
          <label className="block text-gray-300 mb-2">Contributors</label>
          <div className="flex mb-2 relative">
            <input
              type="text"
              placeholder="Search for a contributor"
              value={contributorSearch}
              onChange={(e) => setContributorSearch(e.target.value)}
              className="flex-grow p-2 bg-gray-700 text-gray-300 rounded-lg"
            />
            {filteredContributors.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-700 mt-1 rounded-lg max-h-40 overflow-y-auto z-10">
                {filteredContributors.map((user) => (
                  <div
                    key={user._id}
                    className="p-2 hover:bg-gray-600 cursor-pointer"
                    onClick={() => addContributor(user)}
                  >
                    {user.username}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {contributors.map((contributor) => (
              <div
                key={contributor._id}
                className="bg-gray-600 text-white px-3 py-1 rounded-full flex items-center"
              >
                {contributor.username}
                <button
                  type="button"
                  onClick={() => removeContributor(contributor._id)}
                  className="ml-2 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mentors */}
        <div>
          <label className="block text-gray-300 mb-2">Mentors</label>
          <div className="flex mb-2 relative">
            <input
              type="text"
              placeholder="Search for a mentor"
              value={mentorSearch}
              onChange={(e) => setMentorSearch(e.target.value)}
              className="flex-grow p-2 bg-gray-700 text-gray-300 rounded-lg"
            />
            {filteredMentors.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-700 mt-1 rounded-lg max-h-40 overflow-y-auto z-10">
                {filteredMentors.map((user) => (
                  <div
                    key={user._id}
                    className="p-2 hover:bg-gray-600 cursor-pointer"
                    onClick={() => addMentor(user)}
                  >
                    {user.username}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {mentors.map((mentor) => (
              <div
                key={mentor._id}
                className="bg-gray-600 text-white px-3 py-1 rounded-full flex items-center"
              >
                {mentor.username}
                <button
                  type="button"
                  onClick={() => removeMentor(mentor._id)}
                  className="ml-2 text-gray-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-gray-300 mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 bg-gray-700 text-gray-300 rounded-lg cursor-pointer"
            required
          />
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mt-4">
            <img src={preview} alt="Preview" className="w-full rounded-lg" />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
