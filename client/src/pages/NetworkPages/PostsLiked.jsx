import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  MapPin,
  Code,
  Users,
  GraduationCap,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react";

const PostsLiked = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLikedPosts();
  }, []);

  const fetchLikedPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/post/likedposts");
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`/api/v1/post/${postId}/like`);
      fetchLikedPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handleShare = (postId) => {
    console.log("Share post:", postId);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-white">My Liked Posts</h2>

      {loading ? (
        <div className="text-center py-8 text-white">
          Loading liked posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No liked posts available
        </div>
      ) : (
        posts?.map((post) => (
          <div
            key={post._id}
            className="bg-gray-900 rounded-lg shadow-md mb-6 overflow-hidden flex"
          >
            {post.image && (
              <div className="w-1/2">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="w-1/2 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white">{post.author.name}</h3>
                <p className="text-gray-400">{post.author.headline}</p>
                <p className="text-white mt-2">{post.content}</p>

                {post.date && (
                  <div className="flex items-center text-gray-400 mt-2">
                    <Calendar size={16} className="mr-2" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                )}
                {post.venue && (
                  <div className="flex items-center text-gray-400 mt-2">
                    <MapPin size={16} className="mr-2" />
                    <span>{post.venue}</span>
                  </div>
                )}

                {/* skills Section */}
                {post.skills && post.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Code size={18} className="text-gray-400" />
                    {post.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contributors Section */}
                {post.contributors && post.contributors.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Users size={18} className="text-gray-400" />
                    <span className="text-gray-400">Contributors: </span>
                    {post.contributors.map((contributor, index) => (
                      <span
                        key={index}
                        className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {contributor.username}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mentors Section */}
                {post.mentors && post.mentors.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <GraduationCap size={18} className="text-gray-400" />
                    <span className="text-gray-400">Mentors: </span>
                    {post.mentors.map((mentor, index) => (
                      <span
                        key={index}
                        className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {mentor.username}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-800 mt-4 pt-2 flex justify-between">
                <button
                  onClick={() => handleLike(post._id)}
                  className="flex items-center text-gray-400 hover:text-blue-500"
                >
                  <Heart
                    size={20}
                    className={`mr-1 ${
                      post.likes.includes(localStorage.getItem("userId"))
                        ? "text-red-500 fill-red-500"
                        : ""
                    }`}
                  />
                  <span>{post.likes.length}</span>
                </button>
                <button
                  onClick={() => handleComment(post._id)}
                  className="flex items-center text-gray-400 hover:text-blue-500"
                >
                  <MessageSquare size={20} className="mr-1" />
                  <span>{post.comments.length}</span>
                </button>
                <button
                  onClick={() => handleShare(post._id)}
                  className="flex items-center text-gray-400 hover:text-blue-500"
                >
                  <Share2 size={20} />
                </button>
              </div>

              <div className="text-right text-xs text-gray-500 mt-2">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PostsLiked;
