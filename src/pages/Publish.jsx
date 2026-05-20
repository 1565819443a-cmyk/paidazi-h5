import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, createDemand } from '../utils/supabase';
import { getStorageSync } from '../utils/storage';
import { addMyPostId, getProfile } from '../utils/user';
import { useToast } from '../components/Toast';
import './Publish.css';

export default function Publish() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const types = ['找搭子', '学习笔记', '美食测评', '失物招领', '树洞', '二手交易'];
  const typeValues = ['partner', 'note', 'food', 'lost', 'treehole', 'secondhand'];

  const categoryMap = {
    partner: ['学习', '运动', '游戏', '干饭', '其他'],
    note: ['高数', '英语', '专业课', '考研', '其他'],
    food: ['食堂', '外卖', '校外美食', '奶茶', '其他'],
    lost: ['丢失', '捡到'],
    treehole: ['情感', '学业', '生活', '吐槽', '其他'],
    secondhand: ['教材', '电子产品', '生活用品', '其他'],
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
        const personality = getStorageSync('personality') || {};
        const profile = getProfile();
        await createDemand({
          category: selectedCategory,
          categoryName: selectedCategory,
          nickname: profile.nickname,
          avatar: profile.avatar,
          tags: [title],
          personalityAnswers: personality,
        });
      } else {
        const fullContent = price
          ? `💰 ${price}元\n${content}`
          : content;
        const profile = getProfile();
        const result = await createPost({
          category: selectedType,
          categoryName: typeName,
          nickname: profile.nickname,
          avatar: profile.avatar,
          content: fullContent,
        });
        addMyPostId(result.id);
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
              {categoryMap[selectedType].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        )}

        <div className="form-item">
          <span className="label">📝 标题</span>
          <input className="input" placeholder="请输入标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-item">
          <span className="label">📄 内容</span>
          <textarea className="textarea" placeholder="请详细描述..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>

        {selectedType === 'secondhand' && (
          <div className="form-item">
            <span className="label">💰 价格</span>
            <input className="input" placeholder="请输入价格" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        )}

        <div className="form-item">
          <span className="label">📱 联系方式</span>
          <input className="input" placeholder="微信/QQ/手机号（选填）" value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>

        <button className="submit-btn" onClick={submitForm} disabled={submitting}>
          {submitting ? '发布中...' : '发布'}
        </button>
      </div>
    </div>
  );
}
