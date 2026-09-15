import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvite, fetchDemands } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { getCreditLevelInfo } from '../utils/creditUtils';
import { useToast } from '../components/Toast';
import './StudyPartner.css';

const studyTypes = [
  { key: 'cet', icon: '📝', label: '四六级搭子', desc: '一起打卡背单词、练听力' },
  { key: 'kaoyan', icon: '📚', label: '考研搭子', desc: '互相监督、共享资料' },
  { key: 'math', icon: '🔢', label: '高数搭子', desc: '攻克高数难题' },
  { key: 'library', icon: '🏛️', label: '图书馆自习搭子', desc: '每天一起去图书馆' },
  { key: 'thesis', icon: '📄', label: '论文排版搭子', desc: 'LaTeX/Word排版互助' },
  { key: 'morning', icon: '🌅', label: '早八搭子', desc: '互相叫起床' },
  { key: 'night', icon: '🌙', label: '晚自习搭子', desc: '晚上一起自习' },
  { key: 'modeling', icon: '📊', label: '数模搭子', desc: '数学建模训练搭子' },
  { key: 'latex', icon: '📐', label: 'LaTeX互助搭子', desc: '论文公式排版交流' },
];

export default function StudyPartner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [studyPartners, setStudyPartners] = useState([]);

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    const data = await fetchDemands();
    setStudyPartners((data || []).filter((item) => item.category === 'study'));
  }

  async function handleInvite(partner) {
    if (partner.user_id === user?.id) {
      showToast('这是你自己发布的学习需求', 'none');
      return;
    }
    try {
      await createInvite({
        toUser: partner.nickname,
        toUserId: partner.user_id,
        demandId: partner.id,
        content: `邀请你一起学习：${partner.title || (partner.tags || []).join('、')}`,
      });
      showToast(`已向 ${partner.nickname} 发送学习邀请`, 'success');
    } catch {
      showToast('发送失败，请重试');
    }
  }

  return (
    <div className="sp-container">
      <div className="sp-header" onClick={() => navigate(-1)}>
        <span className="sp-back">‹ 返回</span>
        <span className="sp-title">📚 学习搭子</span>
        <span className="sp-subtitle">找到一起进步的学习伙伴</span>
      </div>

      <div className="sp-types">
        {studyTypes.map((t) => (
          <div key={t.key} className="sp-type-item">
            <span className="sp-type-icon">{t.icon}</span>
            <span className="sp-type-label">{t.label}</span>
            <span className="sp-type-desc">{t.desc}</span>
          </div>
        ))}
      </div>

      <div className="sp-section-title">⭐ 真实学习搭子</div>
      <div className="sp-list">
        {studyPartners.map((p) => {
          const level = getCreditLevelInfo(80);
          return (
            <div key={p.id} className="sp-card">
              <div className="sp-card-hd">
                <img className="sp-avatar" src={p.avatar} alt="" />
                <div className="sp-user">
                  <span className="sp-nickname">{p.nickname}</span>
                  <span className="sp-study-type">{p.title || p.category_name}</span>
                </div>
                <span className="sp-match">真实发布</span>
              </div>
              <div className="sp-tags">
                {(p.tags || []).slice(0, 2).map((tag) => <span key={tag} className="sp-tag">📌 {tag}</span>)}
              </div>
              <div className="sp-skills">
                {(p.tags || []).slice(2).map((s, i) => <span key={i} className="sp-skill-tag">{s}</span>)}
              </div>
              <div className="sp-card-footer">
                <div className="sp-credit-wrap">
                  <span className="sp-credit" style={{ color: level.color }}>信用80 · {level.badge}</span>
                  <span className="sp-reason">💡 来自真实用户发布</span>
                </div>
                <button className="sp-invite-btn" onClick={() => handleInvite(p)}>约TA</button>
              </div>
            </div>
          );
        })}
        {studyPartners.length === 0 && <div className="sp-empty">暂无真实学习搭子，去发布一个学习需求吧</div>}
      </div>
    </div>
  );
}
