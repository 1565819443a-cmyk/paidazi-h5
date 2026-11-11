import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TabBar from './components/TabBar';
import Login from './pages/Login';

const Index = lazy(() => import('./pages/Index'));
const Community = lazy(() => import('./pages/Community'));
const Publish = lazy(() => import('./pages/Publish'));
const Message = lazy(() => import('./pages/Message'));
const Profile = lazy(() => import('./pages/Profile'));
const Comment = lazy(() => import('./pages/Comment'));
const Personality = lazy(() => import('./pages/Personality'));
const Food = lazy(() => import('./pages/Food'));
const Lost = lazy(() => import('./pages/Lost'));
const Treehole = lazy(() => import('./pages/Treehole'));
const Secondhand = lazy(() => import('./pages/Secondhand'));
const MyPosts = lazy(() => import('./pages/MyPosts'));
const MyInvites = lazy(() => import('./pages/MyInvites'));
const MyBookmarks = lazy(() => import('./pages/MyBookmarks'));
const AiChat = lazy(() => import('./pages/AiChat'));
const CreditCenter = lazy(() => import('./pages/CreditCenter'));
const TeamHall = lazy(() => import('./pages/TeamHall'));
const StudyPartner = lazy(() => import('./pages/StudyPartner'));
const ToDoList = lazy(() => import('./pages/ToDoList'));
const Toolbox = lazy(() => import('./pages/Toolbox'));
const MathViz = lazy(() => import('./pages/MathViz'));
const LatexHelper = lazy(() => import('./pages/LatexHelper'));
const Translation = lazy(() => import('./pages/Translation'));
const Canteen = lazy(() => import('./pages/Canteen'));
const ChatList = lazy(() => import('./pages/ChatList'));
const ChatDetail = lazy(() => import('./pages/ChatDetail'));
const TagProfile = lazy(() => import('./pages/TagProfile'));
const Moderation = lazy(() => import('./pages/Moderation'));

const tabPaths = ['/index', '/community', '/publish', '/message', '/profile'];

export default function App() {
  return (
    <>
      <div className="page-content">
        <Suspense fallback={<div className="route-loading">正在加载 π搭子…</div>}><Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
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
          <Route path="/moderation" element={<Moderation />} />
        </Routes></Suspense>
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
