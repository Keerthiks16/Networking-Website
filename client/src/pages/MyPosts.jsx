import React, { useEffect, useState } from "react";
import axios from "axios";
import Feed from "../components/Feed";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const response = await axios.get("/api/v1/post/myposts");
        setPosts(response.data);
      } catch (err) {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  if (loading) return <p className="text-white">Loading your posts...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (posts.length === 0)
    return <p className="text-gray-400">No posts found.</p>;

  return (
    <div className="mx-auto py-8">
      <h2 className="text-white text-xl font-bold mb-4">My Posts</h2>
      <Feed posts={posts} />
    </div>
  );
};

export default MyPosts;
