import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInvites } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import './Message.css';

export default function Message() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('invite');
  const [allMessages, setAllMessages] = useState({ invite: [], comment: [], like: [], system: [], chat: [] });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: 'invite', label: '搭子邀请' },
    { key: 'chat', label: '聊天' },
    { key: 'comment', label: '评论回复' },
    { key: 'like', label: '点赞通知' },
    { key: 'system', label: '系统提醒' },
  ];

  useEffect(() => { loadMessages(); }, []);

  async function loadMessages() {
    setLoading(true);
    try {
      const invites = await fetchInvites();
      setAllMessages({
        invite: invites.map((inv) => ({
          id: inv.id,
          fromUser: inv.from_user_id === user?.id ? `我邀请：${inv.to_user}` : `${inv.from_nickname} 邀请我`,
          avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
          time: formatTime(inv.created_at),
          content: inv.content || '邀请你一起学习',
          status: inv.status,
        })),
        chat: [],
        comment: [],
        like: [],
        system: [],
      });
    } catch (err) {
      console.error('加载消息失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return '未知';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min}分钟前`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  const display = allMessages[currentTab] || [];

  return (
    <div className="message-container">
      <div className="msg-header">
        <span className="msg-title">💬 消息</span>
      </div>

      <div className="msg-tabs">
        {tabs.map((tab) => (
          <span key={tab.key} className={`msg-tab-item ${currentTab === tab.key ? 'active' : ''}`} onClick={() => setCurrentTab(tab.key)}>
            {tab.label}
          </span>
        ))}
      </div>

      <div className="msg-list">
        {loading && (
          <div className="empty"><span>加载中...</span></div>
        )}

        {!loading && display.length === 0 ? (
          <div className="empty"><span>暂无消息</span></div>
        ) : (
          display.map((item, i) => (
            <div key={item.id || i} className="msg-item" onClick={() => { if (currentTab === 'chat') navigate(`/chat-detail?id=${item.id}`); }}>
              <img className="msg-avatar" src={item.avatar} alt="" />
              <div className="msg-content">
                <div className="msg-hd">
                  <span className="msg-from">{item.fromUser}</span>
                  <span className="msg-time">{item.time}</span>
                </div>
                <span className="msg-text">{item.content}</span>
                <div className="msg-meta">
                  {item.status && (
                    <span className={`msg-status ${item.status}`}>
                      {item.status === 'pending' ? '待处理' : '已处理'}
                    </span>
                  )}
                  {item.unread > 0 && <span className="msg-unread">{item.unread}条未读</span>}
                  {item.sparkDays > 0 && <span className="msg-spark">🔥{item.sparkDays}天火花</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
