import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TabBar from './components/TabBar';
import Index from './pages/Index';
import Login from './pages/Login';
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
import CreditCenter from './pages/CreditCenter';
import TeamHall from './pages/TeamHall';
import StudyPartner from './pages/StudyPartner';
import ToDoList from './pages/ToDoList';
import Toolbox from './pages/Toolbox';
import MathViz from './pages/MathViz';
import LatexHelper from './pages/LatexHelper';
import Translation from './pages/Translation';
import Canteen from './pages/Canteen';
import ChatList from './pages/ChatList';
import ChatDetail from './pages/ChatDetail';
import TagProfile from './pages/TagProfile';

const tabPaths = ['/index', '/community', '/publish', '/message', '/profile'];

export default function App() {
  return (
    <>
      <div className="page-content">
        <Routes>
          <Route path="/login" element={<Login />} />
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
          <Route path="/credit-center" element={<CreditCenter />} />
          <Route path="/team-hall" element={<TeamHall />} />
          <Route path="/study-partner" element={<StudyPartner />} />
          <Route path="/todolist" element={<ToDoList />} />
          <Route path="/toolbox" element={<Toolbox />} />
          <Route path="/math-viz" element={<MathViz />} />
          <Route path="/latex-helper" element={<LatexHelper />} />
          <Route path="/translation" element={<Translation />} />
          <Route path="/canteen" element={<Canteen />} />
          <Route path="/chat-list" element={<ChatList />} />
          <Route path="/chat-detail" element={<ChatDetail />} />
          <Route path="/tag-profile" element={<TagProfile />} />
        </Routes>
      </div>
      <TabBarWrapper />
    </>
  );
}

function TabBarWrapper() {
  const location = useLocation();
  const path = location.pathname || '/index';
  if (tabPaths.some((p) => path.startsWith(p))) {
    return <TabBar />;
  }
  return null;
}
