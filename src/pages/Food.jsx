import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPosts, fetchBookmarkIds, toggleBookmark } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Community.css';

export default function Food() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const [data, bookmarks] = await Promise.all([fetchPosts(), fetchBookmarkIds()]);
      setBookmarkIds(bookmarks);
      setPosts((data || []).filter((item) => item.category === 'food'));
    } catch { showToast('加载失败'); }
    finally { setLoading(false); }
  }

  async function handleBookmark(id) {
    try {
      const added = await toggleBookmark(id);
      setBookmarkIds((prev) => added ? [id, ...prev] : prev.filter((item) => item !== id));
      showToast(added ? '已收藏' : '已取消收藏', 'success');
    } catch {
      showToast('收藏失败');
    }
  }

  function formatTime(d) {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m}分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}小时前`;
    return `${Math.floor(h / 24)}天前`;
  }

  return (
    <div className="community-container">
      <div className="comm-header">
        <span className="comm-title">🍔 美食测评</span>
        <span className="comm-subtitle">校园美食分享</span>
      </div>

      <div className="publish-card" onClick={() => navigate('/publish')}>
        <img className="publish-avatar" src={profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" />
        <span className="publish-placeholder">分享你的美食发现...</span>
        <div className="publish-btn">发布</div>
      </div>

      {loading && <div className="empty"><span>加载中...</span></div>}
      {!loading && posts.length === 0 && <div className="empty"><span>暂无美食分享</span></div>}

      <div className="post-list">
        {posts.map((item) => (
          <div key={item.id} className="post-item" onClick={() => navigate(`/comment?postId=${item.id}`)}>
            <div className="post-header">
              <img className="post-avatar" src={item.avatar} alt="" />
              <div className="post-user">
                <span className="post-nickname">{item.nickname}</span>
                <span className="post-time">{formatTime(item.created_at)}</span>
              </div>
              <div className="post-cat food">{item.category_name}</div>
            </div>
            <div className="post-content"><span className="post-text">{item.content}</span></div>
            <div className="post-actions" onClick={(e) => e.stopPropagation()}>
              <div className="action-item">
                <span className="action-icon">❤️</span>
                <span className="action-text">{item.likes || 0}</span>
              </div>
              <div className="action-item" onClick={() => navigate(`/comment?postId=${item.id}`)}>
                <span className="action-icon">💬</span>
                <span className="action-text">{item.comments_count || 0}</span>
              </div>
              <div className="action-item" onClick={() => handleBookmark(item.id)}>
                <span className="action-icon">{bookmarkIds.includes(item.id) ? '⭐' : '☆'}</span>
                <span className="action-text">收藏</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
