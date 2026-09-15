import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, createDemand } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { getStorageSync } from '../utils/storage';
import { useToast } from '../components/Toast';
import './Publish.css';

export default function Publish() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const types = ['找搭子', '学习笔记', '美食测评', '失物招领', '树洞', '二手交易'];
  const typeValues = ['partner', 'note', 'food', 'lost', 'treehole', 'secondhand'];

  const categoryMap = {
    partner: [
      { value: 'study', label: '学习' },
      { value: 'sports', label: '运动' },
      { value: 'game', label: '游戏' },
      { value: 'food', label: '干饭' },
      { value: 'other', label: '其他' },
    ],
    note: [{ value: 'note', label: '学习笔记' }],
    food: [{ value: 'food', label: '美食测评' }],
    lost: [{ value: 'lost', label: '失物招领' }],
    treehole: [{ value: 'treehole', label: '树洞' }],
    secondhand: [{ value: 'secondhand', label: '二手交易' }],
  };

  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitForm() {
    if (!selectedType || !selectedCategory || !title || !content) {
      showToast('请填写完整信息');
      return;
    }

    setSubmitting(true);

    try {
      const typeName = types[typeValues.indexOf(selectedType)];

      if (selectedType === 'partner') {
        const personality = profile?.personality_answers?.q1 ? profile.personality_answers : (getStorageSync('personality') || {});
        const category = categoryMap.partner.find((item) => item.value === selectedCategory);
        await createDemand({
          category: selectedCategory,
          categoryName: category?.label || selectedCategory,
          title,
          contact,
          tags: [title, content].filter(Boolean),
          personalityAnswers: personality,
        });
      } else {
        const fullContent = price
          ? `💰 ${price}元\n${content}`
          : content;
        await createPost({
          category: selectedType,
          categoryName: typeName,
          title,
          content: fullContent,
          contact,
        });
      }

      showToast('发布成功', 'success');

      setTimeout(() => {
        navigate('/index');
      }, 1500);
    } catch (err) {
      console.error('发布失败:', err);
      showToast('发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="publish-container">
      <div className="publish-header">
        <span className="publish-title">发布新内容</span>
      </div>

      <div className="form">
        <div className="form-item">
          <span className="label">📌 发布类型</span>
          <select className="picker" value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedCategory(''); }}>
            <option value="">请选择类型</option>
            {typeValues.map((v, i) => <option key={v} value={v}>{types[i]}</option>)}
          </select>
        </div>

        {selectedType && (
          <div className="form-item">
            <span className="label">📋 分类</span>
            <select className="picker" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">请选择分类</option>
              {categoryMap[selectedType].map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>
        )}

        <div className="form-item">
          <span className="label">📝 标题</span>
          <input className="input" maxLength={40} placeholder="请输入标题（最多40字）" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-item">
          <span className="label">📄 内容</span>
          <textarea className="textarea" maxLength={500} placeholder="请详细描述（最多500字）" value={content} onChange={(e) => setContent(e.target.value)} />
        </div>

        {selectedType === 'secondhand' && (
          <div className="form-item">
            <span className="label">💰 价格</span>
            <input className="input" placeholder="请输入价格" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        )}

        <div className="form-item">
          <span className="label">📱 联系方式</span>
          <input className="input" maxLength={50} placeholder="微信/QQ（选填，请勿填写手机号）" value={contact} onChange={(e) => setContact(e.target.value)} />
          <span className="privacy-hint">联系方式会随内容公开展示，请勿填写手机号、宿舍号等敏感信息。</span>
        </div>

        <button className="submit-btn" onClick={submitForm} disabled={submitting}>
          {submitting ? '发布中...' : '发布'}
        </button>
      </div>
    </div>
  );
}
