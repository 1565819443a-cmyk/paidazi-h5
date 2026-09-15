import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInvites } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import './MyInvites.css';

export default function MyInvites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyInvites();
  }, []);

  async function loadMyInvites() {
    setLoading(true);
    try {
      const data = await fetchInvites();
      setInvites(data || []);
    } catch {
      setInvites([]);
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
    <div className="my-invites-container">
      <div className="mi-header">
        <span className="mi-back" onClick={() => navigate('/profile')}>‹</span>
        <span className="mi-title">💌 我的邀请</span>
      </div>

      {loading && <div className="empty"><span>加载中...</span></div>}
      {!loading && invites.length === 0 && <div className="empty"><span>暂无邀请记录</span></div>}

      {invites.map((item) => (
        <div key={item.id} className="mi-item">
          <div className="mi-to">
            📨 {item.from_user_id === user?.id ? `我邀请：${item.to_user}` : `${item.from_nickname} 邀请我`}
          </div>
          <div className="mi-content">{item.content || '邀请你一起学习'}</div>
          <div className="mi-footer">
            <span className="mi-time">{formatTime(item.created_at)}</span>
            <span className={`mi-status ${item.status}`}>
              {item.status === 'pending' ? '待处理' : '已接受'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
