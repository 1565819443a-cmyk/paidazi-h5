import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, fetchDemands, createInvite } from '../utils/supabase';
import { getStorageSync } from '../utils/storage';
import { addMyInviteId } from '../utils/user';
import { aiChat, buildMatchmakerPrompt } from '../utils/ai';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useShare } from '../components/ShareSheet';
import './Index.css';

const SAMPLE_DEMANDS = [
  { category: 'study', category_name: '学习', nickname: '陈小明', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', tags: ['晚上学习', '考研数学', '图书馆'], personality_answers: { q1: 'A', q2: 'A', q3: 'A' } },
  { category: 'sports', category_name: '运动', nickname: '李小红', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', tags: ['周末', '羽毛球', '体育馆'], personality_answers: { q1: 'B', q2: 'B', q3: 'B' } },
  { category: 'game', category_name: '游戏', nickname: '张同学', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', tags: ['晚上', '王者荣耀', '开黑'], personality_answers: { q1: 'C', q2: 'C', q3: 'A' } },
];

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const hotActivities = [
    { title: '周末图书馆组队', participants: 12, time: '周六 14:00', tag: '学习中' },
    { title: '羽毛球双打缺一人', participants: 3, time: '今晚 19:00', tag: '运动中' },
    { title: '二食堂干饭小分队', participants: 5, time: '12:00', tag: '干饭中' },
  ];

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
      let demands = await fetchDemands();
      if (demands.length === 0) {
        await seedDemands();
        demands = await fetchDemands();
      }
      setAllDemands(demands);
      filterAndSet(demands, currentCategory);
    } catch (err) {
      console.error('加载搭子列表失败:', err);
      showToast('加载失败，请检查网络');
    } finally {
      setLoading(false);
    }
  }

  async function seedDemands() {
    for (const d of SAMPLE_DEMANDS) {
      await supabase.from('demands').insert({
        category: d.category,
        category_name: d.category_name,
        nickname: d.nickname,
        avatar: d.avatar,
        tags: d.tags,
        personality_answers: d.personality_answers,
        created_at: new Date().toISOString(),
      });
    }
  }

  function calcMatch(demandP, userP) {
    if (!userP || !userP.q1) return Math.floor(Math.random() * 20) + 80;
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
    const personality = getStorageSync('personality') || {};
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
    setDisplayList((prev) => [...prev].sort(() => Math.random() - 0.5));
    showToast('已刷新', 'none');
  }

  function handleInvite(user, id) {
    setInviteTarget({ user, id });
    setShowModal(true);
  }

  async function confirmInvite() {
    if (!inviteTarget) return;
    try {
      const result = await createInvite({
        toUser: inviteTarget.user,
        demandId: inviteTarget.id,
        content: `邀请你一起学习`,
      });
      addMyInviteId(result.id);
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

  return (
    <div className="index-container">
      <div className="header">
        <span className="title">π 搭子</span>
        <span className="subtitle">无限可能的社交连接</span>
      </div>

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
        <div style={{ display: 'flex', gap: '3vw' }}>
          <span className="section-title-more" onClick={handleAiRecommend} style={{ color: '#764ba2' }}>
            🤖 AI推荐
          </span>
          <span className="section-title-more" onClick={refreshList}>换一批</span>
        </div>
      </div>

      {showAiResult && (
        <div className="ai-recommend-card" style={{
          background: 'linear-gradient(135deg, #f5f0ff, #fef5ff)',
          borderRadius: '3.2vw',
          padding: '4vw',
          marginBottom: '4vw',
          border: '1px solid #e8d5f5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2vw' }}>
            <span style={{ fontSize: '4.2vw', fontWeight: 600, color: '#764ba2' }}>🤖 AI 智能分析</span>
            <span style={{ fontSize: '3.2vw', color: '#999', cursor: 'pointer' }} onClick={() => setShowAiResult(false)}>✕</span>
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '4vw', color: '#999' }}>
              <span style={{ fontSize: '3.7vw' }}>AI正在分析你的性格和搭子匹配度...</span>
            </div>
          ) : (
            <div style={{ fontSize: '3.7vw', color: '#2c3e50', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
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
                <span className="match-rate">匹配度 {item.matchRate}%</span>
              </div>
              <div className={`category-tag ${item.category}`}>{item.categoryName || item.category_name}</div>
            </div>
            <div className="card-body">
              {(item.tags || []).map((tag, i) => <span key={i} className="tag">{tag}</span>)}
            </div>
            <div className="card-footer">
              <button className="btn invite" onClick={() => handleInvite(item.nickname, item.id)}>约TA</button>
              <button className="btn share" onClick={() => handleShare(item)}>分享</button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">
        <span className="section-title-text">🔥 热门活动</span>
      </div>

      <div className="activity-list">
        {hotActivities.map((act, i) => (
          <div key={i} className="activity-item">
            <div className="activity-info">
              <span className="activity-title">{act.title}</span>
              <span className="activity-meta">{act.participants}人参与 · {act.time}</span>
            </div>
            <div className="activity-tag">{act.tag}</div>
          </div>
        ))}
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
