import { useNavigate, useLocation } from 'react-router-dom';
import './TabBar.css';

const tabs = [
  { path: '/index', label: '首页', icon: '🏠' },
  { path: '/community', label: '社区', icon: '🌱' },
  { path: '/publish', label: '发布', icon: '✏️' },
  { path: '/ai-chat', label: 'AI搭子', icon: '🤖' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`tab-item ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}
