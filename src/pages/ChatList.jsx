import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchInvites } from '../utils/supabase';
import './ChatList.css';

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

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    setLoading(true);
    try {
      const data = await fetchInvites();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cl-container">
      <div className="cl-header" onClick={() => navigate(-1)}>
        <span className="cl-back">‹ 返回</span>
        <span className="cl-title">💬 真实联系</span>
      </div>

      {loading && <div className="cl-empty">加载中...</div>}

      {!loading && items.length === 0 ? (
        <div className="cl-empty">暂无真实联系记录，先去邀请一个搭子吧</div>
      ) : (
        <div className="cl-list">
          {items.map((item) => {
            const isSent = item.from_user_id === user?.id;
            return (
              <div key={item.id} className="cl-item" onClick={() => navigate('/my-invites')}>
                <div className="cl-avatar-wrap">
                  <div className="cl-avatar" style={{ display: 'grid', placeItems: 'center', background: '#eef8f4' }}>
                    {isSent ? '我' : 'TA'}
                  </div>
                </div>
                <div className="cl-info">
                  <div className="cl-info-hd">
                    <span className="cl-name">{isSent ? item.to_user : item.from_nickname}</span>
                    <span className="cl-credit-badge" style={{ fontSize: 'min(2.6vw, 12.48px)', background: '#e8f5e9', color: '#2f8f6f', padding: 'min(0.3vw, 1.44px) min(1.3vw, 6.24px)', borderRadius: 'min(3vw, 14.4px)' }}>
                      {item.status === 'pending' ? '待处理' : '已处理'}
                    </span>
                  </div>
                  <span className="cl-last-msg">{item.content || '邀请你一起学习'}</span>
                </div>
                <div className="cl-meta">
                  <span className="cl-time">{formatTime(item.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="cl-tip">真实版暂不生成模拟聊天，联系记录来自你的真实邀请。</div>
    </div>
  );
}
