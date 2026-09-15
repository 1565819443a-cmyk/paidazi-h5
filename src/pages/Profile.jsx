import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStats } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import creditService from '../services/creditService';
import { getCreditLevelInfo } from '../utils/creditUtils';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, saveProfile, signOut } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState({ posts: 0, partners: 0, likes: 0, comments: 0 });
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(profile?.nickname || 'π星人');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg');
  const [personality, setPersonality] = useState(null);
  const [creditData, setCreditData] = useState(() => creditService.getData());

  useEffect(() => {
    loadStats();
    loadPersonality();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.nickname || 'π星人');
      setEditAvatar(profile.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg');
      if (profile.personality_answers?.q1) setPersonality(profile.personality_answers);
    }
  }, [profile]);

  async function loadStats() {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {}
  }

  function loadPersonality() {
    try {
      const raw = localStorage.getItem('personality');
      if (raw) setPersonality(JSON.parse(raw));
    } catch {}
  }

  function getPersonalityLabel() {
    if (!personality || !personality.q1) return '未测试';
    const labels = {
      q1: { A: '专注学霸', B: '交流达人', C: '随和派' },
      q2: { A: '早起鸟', B: '正常作息', C: '夜猫子' },
      q3: { A: '相似偏好', B: '互补偏好', C: '随缘' },
    };
    return `${labels.q1[personality.q1]} · ${labels.q2[personality.q2]} · ${labels.q3[personality.q3]}`;
  }

  function openEdit() {
    setEditName(profile?.nickname || 'π星人');
    setEditAvatar(profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg');
    setShowEdit(true);
  }

  async function confirmEdit() {
    if (!editName.trim()) {
      showToast('请输入昵称');
      return;
    }
    const newProfile = {
      nickname: editName.trim(),
      avatar: editAvatar.trim() || profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
    };
    try {
      await saveProfile(newProfile);
      setShowEdit(false);
      showToast('保存成功', 'success');
    } catch {
      showToast('保存失败，请重试');
    }
  }

  async function handleSignOut() {
    await signOut();
    showToast('已重置本机访客身份', 'success');
  }

  return (
    <div className="profile-container">
      <div className="user-card">
        <img className="user-avatar" src={profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" />
        <div className="user-info">
          <span className="user-nickname">{profile?.nickname || 'π星人'}</span>
          <span className="profile-phone">{user?.email || user?.phone || '免登录访客'}</span>
          <div className="credit-badge">
            <span className="credit-score">信用分 {creditData.score}</span>
            <span className="credit-rate">{getCreditLevelInfo(creditData.score).level}</span>
          </div>
        </div>
        <button className="edit-btn" onClick={openEdit}>编辑资料</button>
      </div>

      <div className="personality-card" onClick={() => navigate('/personality')}>
        <span className="personality-label">🧠 性格标签</span>
        <span className="personality-value">{getPersonalityLabel()}</span>
        <span className="personality-arrow">›</span>
      </div>

      <div className="stats-grid">
        <div className="stat-item"><span className="stat-num">{stats.posts}</span><span className="stat-label">发布</span></div>
        <div className="stat-item"><span className="stat-num">{stats.partners}</span><span className="stat-label">搭子</span></div>
        <div className="stat-item"><span className="stat-num">{stats.likes}</span><span className="stat-label">获赞</span></div>
        <div className="stat-item"><span className="stat-num">{stats.comments}</span><span className="stat-label">评论</span></div>
      </div>

      <div className="menu-list">
        <div className="menu-item" onClick={() => navigate('/my-posts')}>
          <span className="menu-icon">📋</span><span className="menu-text">我的发布</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/my-invites')}>
          <span className="menu-icon">💌</span><span className="menu-text">我的邀请</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/my-bookmarks')}>
          <span className="menu-icon">⭐</span><span className="menu-text">我的收藏</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/tag-profile')}>
          <span className="menu-icon">🏷️</span><span className="menu-text">个人标签画像</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/credit-center')}>
          <span className="menu-icon">📊</span><span className="menu-text">信用中心</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/my-posts')}>
          <span className="menu-icon">🏆</span><span className="menu-text">我的组队</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/todolist')}>
          <span className="menu-icon">✅</span><span className="menu-text">我的任务</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/chat-list')}>
          <span className="menu-icon">💬</span><span className="menu-text">我的聊天</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={() => navigate('/personality')}>
          <span className="menu-icon">🧠</span><span className="menu-text">性格测试</span><span className="menu-arrow">›</span>
        </div>
        <div className="menu-item" onClick={handleSignOut}>
          <span className="menu-icon">↩</span><span className="menu-text">重置本机身份</span><span className="menu-arrow">›</span>
        </div>
      </div>

      {showEdit && (
        <Modal
          title="编辑资料"
          confirmText="保存"
          content={
            <div>
              <div style={{ marginBottom: '3vw' }}>
                <span style={{ fontSize: '3.7vw', color: '#7f8c8d', display: 'block', marginBottom: '1.3vw' }}>昵称</span>
                <input
                  style={{ width: '100%', height: '10vw', border: '1px solid #ecf0f1', borderRadius: '2vw', padding: '0 3vw', fontSize: '4vw', outline: 'none' }}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="输入昵称"
                />
              </div>
              <div>
                <span style={{ fontSize: '3.7vw', color: '#7f8c8d', display: 'block', marginBottom: '1.3vw' }}>头像链接</span>
                <input
                  style={{ width: '100%', height: '10vw', border: '1px solid #ecf0f1', borderRadius: '2vw', padding: '0 3vw', fontSize: '4vw', outline: 'none' }}
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="粘贴图片链接"
                />
              </div>
            </div>
          }
          onConfirm={confirmEdit}
          onCancel={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
