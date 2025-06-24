import React, { useEffect } from "react"; // Added useEffect import
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/authpages/Signup";
import Login from "./pages/authpages/Login";
import Home from "./pages/Home";
import Network from "./pages/Network";
import Discussion from "./pages/Discussion";
import Community from "./pages/Community";
import Portfolio from "./pages/Portfolio";
import Feed from "./components/Feed";
import useAuthStore from "./store/zustand";
import { LoaderPinwheel } from "lucide-react"; // Make sure to import LoaderPinwheel
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import MyPosts from "./pages/MyPosts";
import MyConnections from "./pages/NetworkPages/MyConnections";
import RequestSent from "./pages/NetworkPages/RequestSent";
import DiscussionsJoined from "./pages/NetworkPages/DiscussionsJoined";
import CommunitiesJoined from "./pages/NetworkPages/CommunitiesJoined";
import PostsLiked from "./pages/NetworkPages/PostsLiked";
import PendingRequests from "./pages/NetworkPages/PendingRequests";
import ProfileViews from "./pages/NetworkPages/ProfileViews";
import CreateGroupChat from "./pages/DiscussionPages/CreateGroupChat";
import GroupDiscussion from "./pages/DiscussionPages/GroupDiscussion";
import GroupSettings from "./pages/DiscussionPages/GroupSettings";

const App = () => {
  const { user, authLoading, authCheck } = useAuthStore();

  useEffect(() => {
    // Only run auth check once when component mounts
    authCheck();
  }, []);

  console.log("Auth State:", { user, authLoading });

  if (authLoading) {
    return (
      <div className="flex bg-gray-900 h-screen justify-center items-center">
        <LoaderPinwheel className="text-green-600 animate-spin duration-700" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes - Redirect to home if already logged in */}
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" replace />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />

        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Feed />} />
          <Route path="network" element={<Network />} />
          <Route path="discussion" element={<Discussion />} />
          <Route path="community" element={<Community />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/createpost" element={<CreatePost />} />
          <Route path="/myposts" element={<MyPosts />} />
          <Route path="/connections" element={<MyConnections />} />
          <Route path="/connections/requests-sent" element={<RequestSent />} />
          <Route path="/discussionsjoined" element={<DiscussionsJoined />} />
          <Route path="/communitiesjoined" element={<CommunitiesJoined />} />
          <Route path="/posts/liked" element={<PostsLiked />} />
          <Route
            path="/connections/pending-requests"
            element={<PendingRequests />}
          />
          <Route path="/profile/views" element={<ProfileViews />} />
          <Route path="/creategroup" element={<CreateGroupChat />} />
          <Route path="/groupdiscussion" element={<GroupDiscussion />} />
          <Route
            path="/editconversation/:groupId"
            element={<GroupSettings />}
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
