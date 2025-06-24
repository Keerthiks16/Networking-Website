import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const Post = ({ post }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Extract post data
  const {
    _id,
    author,
    content,
    image,
    likes = [],
    comments = [],
    createdAt,
    // Additional fields that might be in your actual data
    eventDates,
    skills = [],
    contributors = [],
    mentors = [],
  } = post;

  // Format date
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
  });

  // Handle multiple images (if any)
  const images = image ? [image] : [];

  // Carousel navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden shadow-md">
      {/* Author Info */}
      <div className="p-4 flex items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          {author.profilePicture ? (
            <img
              src={author.profilePicture}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
              {author.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold">{author.name}</h3>
          <p className="text-gray-400 text-sm">
            {author.headline || "Full Stack Developer"}
          </p>
        </div>
      </div>

      {/* Image Carousel (if images exist) */}
      {images.length > 0 && (
        <div className="relative">
          <div className="overflow-hidden">
            <img
              src={images[currentSlide]}
              alt="Post"
              className="w-full object-cover h-64 sm:h-80"
            />
          </div>

          {/* Carousel Navigation (only show if multiple images) */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 w-2 rounded-full ${
                      currentSlide === index ? "bg-white" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="p-4">
        {content && <p className="mb-4 text-gray-200">{content}</p>}

        {/* Event Dates (if available) */}
        {eventDates && (
          <div className="flex items-center mb-4 text-gray-300">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{eventDates}</span>
          </div>
        )}

        {/* Skills (if available) */}
        {skills && skills.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <span className="text-gray-300">Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contributors (if available) */}
        {contributors && contributors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="text-gray-300">
                Contributors ({contributors.length})
              </span>
            </div>
            <div className="flex -space-x-2 overflow-hidden">
              {contributors.map((contributor, index) => (
                <div
                  key={index}
                  className="inline-block rounded-full ring-2 ring-gray-900"
                >
                  {contributor.avatar ? (
                    <img
                      className="w-8 h-8 rounded-full object-cover"
                      src={contributor.avatar}
                      alt={contributor.name}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                      {contributor.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentors (if available) */}
        {mentors && mentors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span className="text-gray-300">Mentors ({mentors.length})</span>
            </div>
            <div className="flex -space-x-2 overflow-hidden">
              {mentors.map((mentor, index) => (
                <div
                  key={index}
                  className="inline-block rounded-full ring-2 ring-gray-900"
                >
                  {mentor.avatar ? (
                    <img
                      className="w-8 h-8 rounded-full object-cover"
                      src={mentor.avatar}
                      alt={mentor.name}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                      {mentor.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Stats & Actions */}
      <div className="px-4 py-3 border-t border-gray-800 flex flex-col space-y-3">
        {/* Engagement Stats */}
        <div className="flex items-center text-gray-400 text-sm">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span>{likes.length}</span>
          </div>
          <div className="flex items-center ml-4">
            <svg
              className="h-5 w-5 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span>{comments.length}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between border-t border-gray-800 pt-3">
          <button className="flex items-center justify-center w-1/3 text-gray-400 hover:text-blue-400 transition">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            Like
          </button>

          <button className="flex items-center justify-center w-1/3 text-gray-400 hover:text-blue-400 transition">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
            </svg>
            Comment
          </button>

          <button className="flex items-center justify-center w-1/3 text-gray-400 hover:text-blue-400 transition">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;
