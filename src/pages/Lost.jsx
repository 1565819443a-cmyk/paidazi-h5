import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { toggleBookmark, isBookmarked } from '../utils/user';
import { useToast } from '../components/Toast';
import './Community.css';

export default function Lost() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('community_posts')
        .select('*')
        .eq('category', 'lost')
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } catch { showToast('加载失败'); }
    finally { setLoading(false); }
  }

  function handleBookmark(id) {
    const added = toggleBookmark(id);
    showToast(added ? '已收藏' : '已取消收藏', 'success');
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
        <span className="comm-title">🔍 失物招领</span>
        <span className="comm-subtitle">丢东西了？来这里找找</span>
      </div>

      <div className="publish-card" onClick={() => navigate('/publish')}>
        <img className="publish-avatar" src="https://randomuser.me/api/portraits/lego/1.jpg" alt="" />
        <span className="publish-placeholder">发布失物信息...</span>
        <div className="publish-btn">发布</div>
      </div>

      {loading && <div className="empty"><span>加载中...</span></div>}
      {!loading && posts.length === 0 && <div className="empty"><span>暂无失物信息</span></div>}

      <div className="post-list">
        {posts.map((item) => (
          <div key={item.id} className="post-item" onClick={() => navigate(`/comment?postId=${item.id}`)}>
            <div className="post-header">
              <img className="post-avatar" src={item.avatar} alt="" />
              <div className="post-user">
                <span className="post-nickname">{item.nickname}</span>
                <span className="post-time">{formatTime(item.created_at)}</span>
              </div>
              <div className="post-cat lost">{item.category_name}</div>
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
                <span className="action-icon">{isBookmarked(item.id) ? '⭐' : '☆'}</span>
                <span className="action-text">收藏</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
