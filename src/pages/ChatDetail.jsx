import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createMessage, fetchInvites, fetchMessages } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './ChatDetail.css';

export default function ChatDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('id');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [invite, setInvite] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!user || !inviteId) { setLoading(false); return; }
    try {
      const [allInvites, rows] = await Promise.all([fetchInvites(), fetchMessages(inviteId)]);
      setInvite((allInvites || []).find((item) => item.id === inviteId) || null);
      setMessages(rows || []);
    } catch (error) {
      showToast(error.message || '聊天加载失败');
    } finally { setLoading(false); }
  }, [inviteId, showToast, user]);

  useEffect(() => {
    // Fetching the participant-scoped conversation is the synchronization performed here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const message = await createMessage(inviteId, input);
      setMessages((current) => [...current, message]);
      setInput('');
    } catch (error) { showToast(error.message || '发送失败'); }
    finally { setSending(false); }
  }

  const isSent = invite?.from_user_id === user?.id;
  const peerName = isSent ? invite?.to_user : invite?.from_nickname;
  const canChat = invite?.status === 'accepted' || invite?.status === 'completed';

  return (
    <div className="cd-container">
      <div className="cd-topbar">
        <span className="cd-back-btn" onClick={() => navigate(-1)}>‹</span>
        <div className="cd-top-info">
          <span className="cd-top-name">{peerName || '真实站内聊天'}</span>
          <div className="cd-top-meta"><span className="cd-top-credit">仅邀请双方可见</span></div>
        </div>
      </div>

      <div className="cd-messages">
        {loading && <div className="cd-tip">正在加载消息…</div>}
        {!loading && !user && <div className="cd-tip">请先登录试点账号</div>}
        {!loading && user && !invite && <div className="cd-tip">未找到该邀请，或你无权访问</div>}
        {!loading && invite && !canChat && <div className="cd-tip">邀请被接受后才能开始聊天</div>}
        {canChat && messages.length === 0 && <div className="cd-tip">邀请已接受，可以发送第一条消息了</div>}
        {messages.map((message) => (
          <div key={message.id} className={`cd-msg ${message.sender_id === user?.id ? 'self' : 'other'}`}>
            <div className="cd-msg-row"><div className="cd-bubble">{message.content}</div></div>
            <span className="cd-message-time">{new Date(message.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {canChat && (
        <div className="cd-input-bar">
          <input className="cd-input" maxLength={1000} value={input} onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) send(); }} placeholder="输入消息，不要发送敏感信息" />
          <button className="cd-send-btn" disabled={sending || !input.trim()} onClick={send}>{sending ? '发送中' : '发送'}</button>
        </div>
      )}
      <div className="cd-tip">请勿发送身份证号、宿舍详细地址等敏感信息；首次见面选择校内公共区域。</div>
    </div>
  );
}
