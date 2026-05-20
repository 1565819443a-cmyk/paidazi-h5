import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { getBookmarkIds, toggleBookmark } from '../utils/user';
import { useToast } from '../components/Toast';
import './MyBookmarks.css';
import './Community.css';

export default function MyBookmarks() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    setLoading(true);
    try {
      const ids = getBookmarkIds();
      if (ids.length === 0) {
        setPosts([]);
        return;
      }
      const { data } = await supabase
        .from('community_posts')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } catch {
      showToast('加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnbookmark(id) {
    toggleBookmark(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    showToast('已取消收藏', 'success');
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min}分钟前`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  return (
    <div className="bookmarks-container">
      <div className="bm-header">
        <span className="bm-back" onClick={() => navigate('/profile')}>‹</span>
        <span className="bm-title">⭐ 我的收藏</span>
      </div>

      {loading && <div className="empty"><span>加载中...</span></div>}
      {!loading && posts.length === 0 && <div className="empty"><span>暂无收藏内容</span></div>}

      {posts.map((item) => (
        <div key={item.id} className="post-item" onClick={() => navigate(`/comment?postId=${item.id}`)}>
          <div className="post-header">
            <img className="post-avatar" src={item.avatar} alt="" />
            <div className="post-user">
              <span className="post-nickname">{item.nickname}</span>
              <span className="post-time">{formatTime(item.created_at)}</span>
            </div>
            <div className={`post-cat ${item.category}`}>{item.category_name}</div>
          </div>
          <div className="post-content">
            <span className="post-text">{item.content}</span>
          </div>
          <div className="post-actions" onClick={(e) => e.stopPropagation()}>
            <div className="action-item" onClick={() => handleUnbookmark(item.id)}>
              <span className="action-icon">⭐</span>
              <span className="action-text" style={{ color: '#e67e22' }}>已收藏</span>
            </div>
            <div className="action-item">
              <span className="action-icon">💬</span>
              <span className="action-text">{item.comments_count || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
