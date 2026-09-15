import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTagsByCategory } from '../utils/tagUtils';
import { useToast } from '../components/Toast';
import './TagProfile.css';

const tagCategories = getTagsByCategory();

export default function TagProfile() {
  const navigate = useNavigate();
  const { profile, saveProfile } = useAuth();
  const { showToast } = useToast();
  const [tags, setTags] = useState(() => profile?.tags || {
    college: '', major: '', grade: '',
    interests: [], skills: [], availableTime: '',
    targetTypes: [], goals: '',
  });
  const [showEdit, setShowEdit] = useState(false);

  function handleToggleTag(cat, tag) {
    const current = [...(tags[cat] || [])];
    const idx = current.indexOf(tag);
    if (idx > -1) current.splice(idx, 1);
    else current.push(tag);
    const updated = { ...tags, [cat]: current };
    setTags(updated);
  }

  async function handleSave() {
    try {
      await saveProfile({ tags });
      setShowEdit(false);
      showToast('标签已保存，将影响推荐结果', 'success');
    } catch {
      showToast('保存失败，请重试');
    }
  }

  const hasTags = Object.values(tags).some((v) => Array.isArray(v) ? v.length > 0 : v);

  return (
    <div className="tp-container">
      <div className="tp-header" onClick={() => navigate(-1)}>
        <span className="tp-back">‹ 返回</span>
        <span className="tp-title">🏷️ 个人标签画像</span>
        <span className="tp-subtitle">完善标签，获得更精准的搭子推荐</span>
      </div>

      {!hasTags && (
        <div className="tp-hint">💡 完善标签后，可以获得更精准的搭子推荐</div>
      )}

      <div className="tp-basic">
        <div className="tp-field">
          <label>学院/专业</label>
          <input value={tags.college || ''} onChange={(e) => setTags({ ...tags, college: e.target.value })} placeholder="如：计算机科学与技术学院" />
        </div>
        <div className="tp-field">
          <label>年级</label>
          <select value={tags.grade || ''} onChange={(e) => setTags({ ...tags, grade: e.target.value })}>
            <option value="">请选择</option>
            <option>大一</option><option>大二</option><option>大三</option><option>大四</option><option>研一</option><option>研二</option><option>研三</option>
          </select>
        </div>
        <div className="tp-field">
          <label>空闲时间</label>
          <input value={tags.availableTime || ''} onChange={(e) => setTags({ ...tags, availableTime: e.target.value })} placeholder="如：晚上、周末" />
        </div>
      </div>

      {Object.entries(tagCategories).map(([cat, tagList]) => (
        <div key={cat} className="tp-category">
          <div className="tp-cat-title">
            {cat === 'study' && '📚 学习方向'}
            {cat === 'contest' && '🏆 竞赛方向'}
            {cat === 'career' && '💼 就业方向'}
            {cat === 'skill' && '🛠️ 技能标签'}
            {cat === 'life' && '🎯 生活兴趣'}
            {cat === 'personality' && '🧠 性格特点'}
          </div>
          <div className="tp-tags">
            {tagList.map((t) => (
              <span key={t} className={`tp-tag ${(tags[cat] || []).includes(t) ? 'selected' : ''}`} onClick={() => handleToggleTag(cat, t)}>{t}</span>
            ))}
          </div>
        </div>
      ))}

      <button className="tp-save-btn" onClick={handleSave}>💾 保存标签</button>
    </div>
  );
}
