import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDemand, createInvite, fetchDemands } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './TeamHall.css';

export default function TeamHall() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', track: '', maxMembers: 4, missingRoles: '', skills: '', deadline: '', desc: '' });

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    const data = await fetchDemands();
    setTeams((data || []).filter((item) => item.category === 'contest').map(formatTeam));
  }

  function formatTeam(item) {
    const tags = item.tags || [];
    const roles = tags.filter((tag) => tag.startsWith('缺：')).map((tag) => tag.replace('缺：', ''));
    const skills = tags.filter((tag) => !tag.startsWith('缺：') && !tag.startsWith('截止：'));
    const deadlineTag = tags.find((tag) => tag.startsWith('截止：'));
    return {
      ...item,
      name: item.title || '竞赛组队',
      track: skills[0] || '竞赛',
      members: 1,
      maxMembers: 4,
      missingRoles: roles,
      skills,
      deadline: deadlineTag?.replace('截止：', '') || '未指定',
      captain: item.nickname,
      captainBadge: item.is_demo ? '示例内容' : '公开发布',
      reason: item.is_demo ? '用于展示竞赛组队流程' : '来自校园用户公开发布',
      description: item.contact ? `联系方式：${item.contact}` : item.title,
    };
  }

  async function handleApply(team) {
    if (team.is_demo) {
      showToast('这是示例队伍，发布真实需求后即可申请', 'none');
      return;
    }
    if (team.user_id === user?.id) {
      showToast('这是你自己发布的组队需求', 'none');
      return;
    }
    try {
      await createInvite({
        toUser: team.captain,
        toUserId: team.user_id,
        demandId: team.id,
        content: `申请加入：${team.name}`,
      });
      showToast('申请已发送', 'success');
    } catch {
      showToast('申请失败，请重试');
    }
  }

  async function handlePublish() {
    if (!form.name.trim() || !form.track.trim()) { showToast('请填写竞赛名称和赛道'); return; }
    try {
      const roles = form.missingRoles.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
      const skills = form.skills.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
      await createDemand({
        category: 'contest',
        categoryName: '竞赛',
        title: form.name,
        contact: form.desc,
        tags: [form.track, ...roles.map((role) => `缺：${role}`), ...skills, form.deadline ? `截止：${form.deadline}` : ''].filter(Boolean),
        personalityAnswers: {},
      });
      await loadTeams();
      setShowForm(false);
      setForm({ name: '', track: '', maxMembers: 4, missingRoles: '', skills: '', deadline: '', desc: '' });
      showToast('发布成功', 'success');
    } catch {
      showToast('发布失败，请稍后重试');
    }
  }

  return (
    <div className="th-container">
      <div className="th-header" onClick={() => navigate(-1)}>
        <span className="th-back">‹ 返回</span>
        <span className="th-title">🏆 竞赛组队大厅</span>
        <span className="th-subtitle">找到你的最佳竞赛搭子</span>
      </div>

      <button className="th-publish-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? '取消发布' : '📢 发布组队需求'}
      </button>

      {showForm && (
        <div className="th-form">
          <input className="th-input" placeholder="竞赛名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="th-input" placeholder="赛道（如大模型应用、数学建模）" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
          <input className="th-input" placeholder="队伍人数上限" type="number" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: +e.target.value })} />
          <input className="th-input" placeholder="缺少角色（逗号分隔：前端,后端,算法）" value={form.missingRoles} onChange={(e) => setForm({ ...form, missingRoles: e.target.value })} />
          <input className="th-input" placeholder="技能要求（逗号分隔）" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <input className="th-input" placeholder="截止时间" type="date" min={new Date().toISOString().slice(0, 10)} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <textarea className="th-textarea" placeholder="备注说明" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          <button className="th-submit-btn" onClick={handlePublish}>发布组队</button>
        </div>
      )}

      <div className="th-list">
        {teams.map((t) => (
            <div key={t.id} className="th-card">
              <div className="th-card-hd">
                <span className="th-card-name">{t.name}</span>
                <span className="th-card-track">{t.track}</span>
              </div>
              <div className="th-card-meta">
                <span>👥 {t.members}/{t.maxMembers}人</span>
                <span>⏰ {t.deadline}</span>
              </div>
              {t.missingRoles.length > 0 && (
                <div className="th-card-roles">🔍 缺：{t.missingRoles.join('、')}</div>
              )}
              <div className="th-card-skills">
                {t.skills.map((s, i) => <span key={i} className="th-tag">{s}</span>)}
              </div>
              <div className="th-card-footer">
                <div className="th-captain">
                  <span>{t.captain}</span>
                  <span className="th-credit">{t.captainBadge}</span>
                </div>
                <div className="th-card-actions">
                  <button className="th-apply-btn" disabled={t.is_demo} onClick={() => handleApply(t)}>{t.is_demo ? '示例' : '申请加入'}</button>
                </div>
              </div>
              <div className="th-reason">💡 {t.reason}</div>
            </div>
        ))}
        {teams.length === 0 && <div className="th-empty">暂无组队信息，发布一个吧！</div>}
      </div>
    </div>
  );
}
