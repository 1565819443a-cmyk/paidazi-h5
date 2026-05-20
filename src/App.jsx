import { Routes, Route, Navigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import Index from './pages/Index';
import Community from './pages/Community';
import Publish from './pages/Publish';
import Message from './pages/Message';
import Profile from './pages/Profile';
import Comment from './pages/Comment';
import Personality from './pages/Personality';
import Food from './pages/Food';
import Lost from './pages/Lost';
import Treehole from './pages/Treehole';
import Secondhand from './pages/Secondhand';
import MyPosts from './pages/MyPosts';
import MyInvites from './pages/MyInvites';
import MyBookmarks from './pages/MyBookmarks';
import AiChat from './pages/AiChat';

const tabPaths = ['/index', '/community', '/publish', '/message', '/profile'];

export default function App() {
  return (
    <>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/index" replace />} />
          <Route path="/index" element={<Index />} />
          <Route path="/community" element={<Community />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/message" element={<Message />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/comment" element={<Comment />} />
          <Route path="/personality" element={<Personality />} />
          <Route path="/food" element={<Food />} />
          <Route path="/lost" element={<Lost />} />
          <Route path="/treehole" element={<Treehole />} />
          <Route path="/secondhand" element={<Secondhand />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/my-invites" element={<MyInvites />} />
          <Route path="/my-bookmarks" element={<MyBookmarks />} />
          <Route path="/ai-chat" element={<AiChat />} />
        </Routes>
      </div>
      <TabBarWrapper />
    </>
  );
}

function TabBarWrapper() {
  const path = window.location.hash.replace('#', '') || '/index';
  if (tabPaths.some((p) => path.startsWith(p))) {
    return <TabBar />;
  }
  return null;
}
