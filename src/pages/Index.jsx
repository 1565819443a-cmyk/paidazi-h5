import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchDemands, createInvite } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { getStorageSync } from '../utils/storage';
import { aiChat, buildMatchmakerPrompt } from '../utils/ai';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useShare } from '../components/ShareSheet';
import './Index.css';

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { share } = useShare();

  const [currentCategory, setCurrentCategory] = useState('all');
  const [allDemands, setAllDemands] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiRecommend, setAiRecommend] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiResult, setShowAiResult] = useState(false);

  const categories = [
    { key: 'all', icon: '🔥', label: '全部' },
    { key: 'study', icon: '📚', label: '学习' },
    { key: 'sports', icon: '🏸', label: '运动' },
    { key: 'game', icon: '🎮', label: '游戏' },
    { key: 'food', icon: '🍔', label: '干饭' },
    { key: 'other', icon: '🎬', label: '其他' },
  ];

  useEffect(() => {
    const shareId = searchParams.get('shareId');
    if (shareId) {
      showToast('来自朋友的分享', 'none');
    }
    loadDemands();
  }, []);

  async function loadDemands() {
    setLoading(true);
    try {
      const demands = await fetchDemands();
      setAllDemands(demands);
      filterAndSet(demands, currentCategory);
    } catch (err) {
      console.error('加载搭子列表失败:', err);
      showToast('加载失败，请检查网络');
    } finally {
      setLoading(false);
    }
  }

  function calcMatch(demandP, userP) {
    if (!userP || !userP.q1) return null;
    let score = 0, total = 0;
    if (demandP.q1 === userP.q1) score += 40;
    else if (Math.abs(demandP.q1.charCodeAt() - userP.q1.charCodeAt()) === 1) score += 20;
    total += 40;
    if (demandP.q2 === userP.q2) score += 35;
    total += 35;
    if (demandP.q3 === 'C' || userP.q3 === 'C') score += 25;
    else if (demandP.q3 === userP.q3) score += 25;
    total += 25;
    return Math.min(99, Math.floor((score / total) * 40 + 60));
  }

  function filterAndSet(demands, cat) {
    const filtered = cat === 'all' ? demands : demands.filter((d) => d.category === cat);
    const personality = profile?.personality_answers?.q1 ? profile.personality_answers : (getStorageSync('personality') || {});
    setDisplayList(filtered.map((d) => ({
      ...d,
      categoryName: d.category_name,
      matchRate: calcMatch(d.personality_answers || {}, personality),
    })));
  }

  function switchCategory(cat) {
    setCurrentCategory(cat);
    filterAndSet(allDemands, cat);
  }

  function refreshList() {
    loadDemands();
    showToast('已刷新', 'none');
  }

  function handleInvite(item) {
    if (item.is_demo) {
      showToast('这是示例内容，发布真实需求后即可体验邀请', 'none');
      return;
    }
    if (item.user_id === user?.id) {
      showToast('这是你自己发布的搭子需求', 'none');
      return;
    }
    setInviteTarget({ user: item.nickname, id: item.id, toUserId: item.user_id, title: item.title || (item.tags || []).join('、') });
    setShowModal(true);
  }

  async function confirmInvite() {
    if (!inviteTarget) return;
    try {
      const result = await createInvite({
        toUser: inviteTarget.user,
        toUserId: inviteTarget.toUserId,
        demandId: inviteTarget.id,
        content: `邀请你一起参与：${inviteTarget.title || '搭子活动'}`,
      });
      if (result) await loadDemands();
      setShowModal(false);
      showToast('邀请已发送', 'success');
    } catch (err) {
      console.error('邀请失败:', err);
      showToast('发送失败，请重试');
    }
  }

  async function handleAiRecommend() {
    if (aiLoading) return;
    setAiLoading(true);
    setShowAiResult(true);
    setAiRecommend('');
    try {
      const personality = getStorageSync('personality') || {};
      const prompt = buildMatchmakerPrompt(personality, allDemands);
      const reply = await aiChat('matchmaker', [{ role: 'user', content: prompt }]);
      setAiRecommend(reply);
    } catch (err) {
      setAiRecommend('AI推荐暂时不可用，请确认已配置 AI_API_KEY 😅');
    } finally {
      setAiLoading(false);
    }
  }

  function handleShare(demand) {
    const tags = demand.tags || [];
    const title = `🎉 一起${demand.categoryName || demand.category_name}：${tags.join('·')}`;
    share(title, `/index?shareId=${demand.id}`);
  }

  const demoItem = allDemands.find((item) => item.is_demo);

  return (
    <div className="index-container">
      <div className="header">
        <span className="title">π 搭子</span>
        <span className="subtitle">无限可能的社交连接</span>
      </div>

      <section className="project-intro">
        <span className="project-intro-badge">星火杯参赛作品</span>
        <h1>面向西电校园的搭子匹配与互助平台</h1>
        <p>从发布需求、智能推荐到发起邀请，让学习、竞赛、运动和校园生活更容易找到同行者。</p>
        <div className="project-intro-steps">
          <span><b>1</b> 发布需求</span>
          <span><b>2</b> 智能匹配</span>
          <span><b>3</b> 沟通组队</span>
        </div>
      </section>

      <div className="categories">
        {categories.map((cat) => (
          <div key={cat.key} className={`category-item ${currentCategory === cat.key ? 'active' : ''}`} onClick={() => switchCategory(cat.key)}>
            <span className="category-icon">{cat.icon}</span>
            <span className="category-text">{cat.label}</span>
          </div>
        ))}
      </div>

      <div className="section-title">
        <span className="section-title-text">⭐ 智能推荐搭子</span>
        <div style={{ display: 'flex', gap: 'min(3vw, 14.4px)' }}>
          <span className="section-title-more" onClick={handleAiRecommend} style={{ color: '#764ba2' }}>
            🤖 AI推荐
          </span>
          <span className="section-title-more" onClick={refreshList}>换一批</span>
        </div>
      </div>

      {demoItem && (
        <div className="demo-notice">
          <b>当前展示示例内容</b>
          <span>{demoItem.demo_reason === 'offline' ? '数据服务暂时无法连接，恢复后会自动显示真实发布。' : '社区还没有公开内容，发布后即可参与真实匹配。'}</span>
        </div>
      )}

      {showAiResult && (
        <div className="ai-recommend-card" style={{
          background: 'linear-gradient(135deg, #f5f0ff, #fef5ff)',
          borderRadius: 'min(3.2vw, 15.36px)',
          padding: 'min(4vw, 19.2px)',
          marginBottom: 'min(4vw, 19.2px)',
          border: '1px solid #e8d5f5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'min(2vw, 9.6px)' }}>
            <span style={{ fontSize: 'min(4.2vw, 20.16px)', fontWeight: 600, color: '#764ba2' }}>🤖 AI 智能分析</span>
            <span style={{ fontSize: 'min(3.2vw, 15.36px)', color: '#999', cursor: 'pointer' }} onClick={() => setShowAiResult(false)}>✕</span>
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: 'min(4vw, 19.2px)', color: '#999' }}>
              <span style={{ fontSize: 'min(3.7vw, 17.76px)' }}>AI正在分析你的性格和搭子匹配度...</span>
            </div>
          ) : (
            <div style={{ fontSize: 'min(3.7vw, 17.76px)', color: '#2c3e50', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {aiRecommend}
            </div>
          )}
        </div>
      )}

      <div className="card-list">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        )}
        {!loading && displayList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无搭子推荐</div>
        )}
        {displayList.map((item) => (
          <div key={item.id} className="card">
            <div className="card-header">
              <img className="avatar" src={item.avatar} alt="" />
              <div className="user-info">
                <span className="nickname">{item.nickname}</span>
                <span className="match-rate">
                  {item.is_demo ? '示例内容' : item.matchRate ? `匹配度 ${item.matchRate}%` : '完成画像后可匹配'}
                </span>
              </div>
              <div className={`category-tag ${item.category}`}>{item.categoryName || item.category_name}</div>
            </div>
            <div className="card-body">
              {(item.tags || []).map((tag, i) => <span key={i} className="tag">{tag}</span>)}
            </div>
            <div className="card-footer">
              <button className="btn invite" onClick={() => handleInvite(item)}>约TA</button>
              <button className="btn share" onClick={() => handleShare(item)}>分享</button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">
        <span className="section-title-text">🧩 功能入口</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'min(2.6vw, 12.48px)', marginBottom: 'min(5vw, 24px)' }}>
        {[
          { icon: '🏆', label: '竞赛组队', to: '/team-hall', color: '#3498db' },
          { icon: '📚', label: '学习搭子', to: '/study-partner', color: '#2ecc71' },
          { icon: '✅', label: '学习清单', to: '/todolist', color: '#e74c3c' },
          { icon: '🧰', label: '工具箱', to: '/toolbox', color: '#9b59b6' },
          { icon: '🍜', label: '食堂推荐', to: '/canteen', color: '#e67e22' },
          { icon: '💬', label: '聊天', to: '/chat-list', color: '#764ba2' },
        ].map((item) => (
          <div key={item.to} onClick={() => navigate(item.to)} style={{ background: '#fff', borderRadius: 'min(3.2vw, 15.36px)', padding: 'min(3vw, 14.4px) min(2vw, 9.6px)', textAlign: 'center', cursor: 'pointer', boxShadow: '0 min(0.5vw, 2.4px) min(2.6vw, 12.48px) rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 'min(6vw, 28.8px)', display: 'block', marginBottom: 'min(1vw, 4.8px)' }}>{item.icon}</span>
            <span style={{ fontSize: 'min(3.4vw, 16.32px)', color: '#2c3e50', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="section-title">
        <span className="section-title-text">🔥 热门活动</span>
      </div>

      <div className="activity-list">
        {allDemands.slice(0, 3).map((act, i) => (
          <div key={i} className="activity-item">
            <div className="activity-info">
              <span className="activity-title">{act.title || (act.tags || []).join('、') || act.category_name}</span>
              <span className="activity-meta">{act.nickname} · {act.category_name}</span>
            </div>
            <div className="activity-tag">{act.is_demo ? '示例' : '公开发布'}</div>
          </div>
        ))}
        {allDemands.length === 0 && (
          <div className="activity-item">
            <div className="activity-info">
              <span className="activity-title">还没有真实活动</span>
              <span className="activity-meta">发布第一个搭子需求后会显示在这里</span>
            </div>
            <div className="activity-tag">待发布</div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="确认邀请"
          content={`确定要邀请 ${inviteTarget?.user} 吗？`}
          onConfirm={confirmInvite}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
