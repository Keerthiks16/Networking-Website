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
  X,
  Plus,
} from "lucide-react";

const Feed = () => {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    fetchAllUsers();
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "feed" ? "/api/v1/post" : "/api/v1/post/myposts";
      const response = await axios.get(endpoint);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/user/getallusers");
      const allUsers = response.data;
      console.log("allUsers:", allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`/api/v1/post/${postId}/like`);
      fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = (post) => {
    setCurrentPost(post);
    setCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    setCommentModalOpen(false);
    setCurrentPost(null);
    setCommentText("");
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      await axios.post(`/api/v1/post/${currentPost._id}/comment`, {
        content: commentText,
      });
      // Refresh the post to see the new comment
      const response = await axios.get(`/api/v1/post/${currentPost._id}`);

      // Update the posts array with the updated post
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === currentPost._id ? response.data : post
        )
      );

      setCommentText("");
      setCommentLoading(false);
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentLoading(false);
    }
  };

  const handleShare = (postId) => {
    console.log("Share post:", postId);
  };

  const navigateToCreatePost = () => {
    navigate("/createpost");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 relative">
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "feed"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("feed")}
        >
          Feed Posts
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "myPosts"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("myPosts")}
        >
          My Posts
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No posts available</div>
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
                    {post.skills.map((keycord, index) => (
                      <span
                        key={index}
                        className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {keycord}
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
                  className="flex items-center text-gray-400 hover:text-green-500"
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
                  onClick={() => handleComment(post)}
                  className="flex items-center text-gray-400 hover:text-green-500"
                >
                  <MessageSquare size={20} className="mr-1" />
                  <span>{post.comments.length}</span>
                </button>
                <button
                  onClick={() => handleShare(post._id)}
                  className="flex items-center text-gray-400 hover:text-green-500"
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

      {/* Create Post Button */}
      <button
        onClick={navigateToCreatePost}
        className="fixed bottom-8 right-8 bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        aria-label="Create Post"
      >
        <Plus size={24} />
      </button>

      {/* Comment Modal */}
      {commentModalOpen && currentPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="text-white font-medium">Comments</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={closeCommentModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {currentPost.comments && currentPost.comments.length > 0 ? (
                currentPost.comments.map((comment, index) => (
                  <div
                    key={index}
                    className="mb-4 border-b border-gray-800 pb-3"
                  >
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-white">
                            {comment.user?.name || "User"}
                          </p>
                          <span className="text-xs text-gray-500">
                            {comment.createdAt
                              ? formatDistanceToNow(
                                  new Date(comment.createdAt),
                                  {
                                    addSuffix: true,
                                  }
                                )
                              : "Recently"}
                          </span>
                        </div>
                        <p className="text-gray-300 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No comments yet
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 bg-gray-800 text-white rounded-l-lg px-4 py-2 focus:outline-none"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") submitComment();
                  }}
                />
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r-lg"
                  onClick={submitComment}
                  disabled={commentLoading}
                >
                  {commentLoading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
