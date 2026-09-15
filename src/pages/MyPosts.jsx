import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyPosts } from '../utils/supabase';
import { useToast } from '../components/Toast';
import './MyPosts.css';
import './Community.css';

export default function MyPosts() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyPosts();
  }, []);

  async function loadMyPosts() {
    setLoading(true);
    try {
      const data = await fetchMyPosts();
      const demands = (data.demands || []).map((item) => ({
        ...item,
        isDemand: true,
        content: (item.tags || []).join('、') || item.title || '找搭子',
        category_name: item.category_name || '找搭子',
      }));
      setPosts([...(data.posts || []), ...demands].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      showToast('加载失败');
    } finally {
      setLoading(false);
    }
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
    <div className="my-posts-container">
      <div className="mp-header">
        <span className="mp-back" onClick={() => navigate('/profile')}>‹</span>
        <span className="mp-title">📋 我的发布</span>
      </div>

      {loading && <div className="empty"><span>加载中...</span></div>}
      {!loading && posts.length === 0 && <div className="empty"><span>暂无发布内容</span></div>}

      {posts.map((item) => (
        <div key={`${item.isDemand ? 'demand' : 'post'}-${item.id}`} className="post-item" onClick={() => !item.isDemand && navigate(`/comment?postId=${item.id}`)}>
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
            <div className="action-item">
              <span className="action-icon">❤️</span>
              <span className="action-text">{item.likes || 0}</span>
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
