import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPosts, likePost, fetchBookmarkIds, toggleBookmark } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { aiChat, buildCommunityPrompt } from '../utils/ai';
import { useToast } from '../components/Toast';
import { useShare } from '../components/ShareSheet';
import './Community.css';

export default function Community() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { share } = useShare();

  const [currentTab, setCurrentTab] = useState('recommend');
  const [allPosts, setAllPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [bookmarkIds, setBookmarkIds] = useState([]);

  const tabs = [
    { key: 'recommend', label: '🔥 推荐' },
    { key: 'info', label: '📢 资讯' },
    { key: 'note', label: '📚 学习' },
    { key: 'food', label: '🍔 美食' },
    { key: 'lost', label: '🔍 失物' },
    { key: 'treehole', label: '💭 树洞' },
    { key: 'secondhand', label: '🛒 二手' },
    { key: 'contest', label: '🏆 竞赛' },
    { key: 'career', label: '💼 就业' },
    { key: 'resource', label: '📂 资料' },
    { key: 'team', label: '👥 组队' },
    { key: 'tool', label: '🛠️ 工具' },
    { key: 'qa', label: '❓ 问答' },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const [posts, bookmarks] = await Promise.all([fetchPosts(), fetchBookmarkIds()]);
      setBookmarkIds(bookmarks);
      const formatted = formatPosts(posts);
      setAllPosts(formatted);
      filterAndSet(formatted, currentTab);
    } catch (err) {
      console.error('加载帖子失败:', err);
      showToast('加载失败，请检查网络');
    } finally {
      setLoading(false);
    }
  }

  function formatPosts(posts) {
    return posts.map((p) => ({
      ...p,
      categoryName: p.category_name,
      commentCount: p.comments_count,
      linkText: p.link_text,
      time: formatTime(p.created_at),
    }));
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

  function filterAndSet(posts, tab) {
    let filtered;
    if (tab === 'recommend') filtered = posts;
    else if (tab === 'info') filtered = posts.filter((p) => p.category === 'info');
    else filtered = posts.filter((p) => p.category === tab);
    setDisplayPosts(filtered);
  }

  function switchTab(tab) {
    setCurrentTab(tab);
    filterAndSet(allPosts, tab);
  }

  async function handleLike(id) {
    const post = allPosts.find((item) => item.id === id);
    if (post?.is_demo) {
      showToast('示例内容暂不支持点赞', 'none');
      return;
    }
    try {
      const likes = await likePost(id);
      const updated = allPosts.map((p) =>
        p.id === id ? { ...p, likes: likes ?? p.likes + 1 } : p
      );
      setAllPosts(updated);
      filterAndSet(updated, currentTab);
      showToast('点赞成功', 'success');
    } catch (err) {
      showToast('点赞失败', 'none');
    }
  }

  function handleComment(id) {
    const post = allPosts.find((p) => p.id === id);
    if (post?.is_demo) {
      showToast('示例内容暂不支持评论', 'none');
      return;
    }
    if (post && post.category === 'info') {
      showToast('资讯暂不支持评论', 'none');
      return;
    }
    navigate(`/comment?postId=${id}`);
  }

  function openLink(url, e) {
    e.stopPropagation();
    window.open(url, '_blank');
  }

  async function handleAiSummary() {
    if (aiLoading) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      const prompt = buildCommunityPrompt(allPosts);
      const reply = await aiChat('community', [{ role: 'user', content: prompt }]);
      setAiSummary(reply);
    } catch (err) {
      setAiSummary('AI助手暂时不可用，请确认已配置 AI_API_KEY 😅');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleBookmark(id, e) {
    e.stopPropagation();
    const post = allPosts.find((item) => item.id === id);
    if (post?.is_demo) {
      showToast('示例内容暂不支持收藏', 'none');
      return;
    }
    try {
      const added = await toggleBookmark(id);
      setBookmarkIds((prev) => added ? [id, ...prev] : prev.filter((item) => item !== id));
      showToast(added ? '已收藏' : '已取消收藏', 'success');
    } catch (err) {
      showToast('收藏失败，请重试');
    }
  }

  function handleShare(post, e) {
    e.stopPropagation();
    const title = `${post.nickname}：${(post.content || '').substring(0, 20)}...`;
    share(title, `/comment?postId=${post.id}`);
  }

  const demoItem = allPosts.find((item) => item.is_demo);

  return (
    <div className="community-container">
      <div className="comm-header">
        <span className="comm-title">🌱 校园社区</span>
        <span className="comm-subtitle">分享你的校园生活</span>
      </div>

      <div className="publish-card" onClick={() => navigate('/publish')}>
        <img className="publish-avatar" src={profile?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="" />
        <span className="publish-placeholder">分享你的校园生活...</span>
        <div className="publish-btn">发布</div>
      </div>

      <div className="category-tabs">
        {tabs.map((tab) => (
          <span key={tab.key} className={`tab-item ${currentTab === tab.key ? 'active' : ''}`} onClick={() => switchTab(tab.key)}>
            {tab.label}
          </span>
        ))}
      </div>

      {demoItem && (
        <div className="community-demo-notice">
          <b>当前展示示例内容</b>
          <span>{demoItem.demo_reason === 'offline' ? '数据服务暂时无法连接，恢复后会自动显示真实动态。' : '社区还没有公开动态，欢迎发布第一条内容。'}</span>
        </div>
      )}

      <div style={{ padding: '0 min(1vw, 4.8px) min(4vw, 19.2px)' }}>
        <div
          onClick={handleAiSummary}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: 'min(3.2vw, 15.36px)',
            padding: 'min(3vw, 14.4px) min(4vw, 19.2px)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 'min(5.3vw, 25.44px)', marginRight: 'min(3vw, 14.4px)' }}>🤖</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 'min(4.2vw, 20.16px)', fontWeight: 600, display: 'block' }}>AI 社区管家</span>
            <span style={{ fontSize: 'min(3.2vw, 15.36px)', opacity: 0.8 }}>点击查看今日热门话题和推荐</span>
          </div>
          <span style={{ fontSize: 'min(4vw, 19.2px)' }}>›</span>
        </div>

        {aiSummary && (
          <div style={{
            background: '#fff',
            borderRadius: 'min(3.2vw, 15.36px)',
            padding: 'min(4vw, 19.2px)',
            marginTop: 'min(3vw, 14.4px)',
            border: '1px solid #e8d5f5',
            fontSize: 'min(3.7vw, 17.76px)',
            color: '#2c3e50',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'min(2vw, 9.6px)' }}>
              <span style={{ fontSize: 'min(4.2vw, 20.16px)', fontWeight: 600, color: '#764ba2' }}>📊 AI 社区分析</span>
              <span style={{ fontSize: 'min(3.2vw, 15.36px)', color: '#999', cursor: 'pointer' }} onClick={() => setAiSummary('')}>✕</span>
            </div>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: 'min(3vw, 14.4px)', color: '#999' }}>AI正在分析社区内容...</div>
            ) : (
              aiSummary
            )}
          </div>
        )}
      </div>

      <div className="post-list">
        {loading && (
          <div className="empty"><span className="empty-text">加载中...</span></div>
        )}

        {!loading && displayPosts.length === 0 && (
          <div className="empty"><span className="empty-text">暂无内容</span></div>
        )}

        {displayPosts.map((item) => (
          <div key={item.id} className="post-item" onClick={() => {
            if (item.is_demo) { showToast('这是功能示例，发布真实内容后即可互动', 'none'); return; }
            if (item.category === 'info') return;
            navigate(`/comment?postId=${item.id}`);
          }}>
            <div className="post-header">
              <img className="post-avatar" src={item.avatar} alt="" />
              <div className="post-user">
                <span className="post-nickname">{item.nickname}</span>
                <span className="post-time">{item.time}</span>
              </div>
              <div className={`post-cat ${item.category}`}>{item.is_demo ? `示例 · ${item.categoryName}` : item.is_local ? `本机 · ${item.categoryName}` : item.categoryName}</div>
            </div>

            <div className="post-content">
              <span className="post-text">{item.content}</span>
              {item.url && (
                <div className="post-link" onClick={(e) => openLink(item.url, e)}>
                  <span className="link-icon">🔗</span>
                  <span className="link-text">{item.linkText || '点击查看详情'}</span>
                </div>
              )}
            </div>

            <div className="post-actions" onClick={(e) => e.stopPropagation()}>
              <div className="action-item" onClick={() => handleLike(item.id)}>
                <span className="action-icon">❤️</span>
                <span className="action-text">{item.likes || 0}</span>
              </div>
              <div className="action-item" onClick={() => handleComment(item.id)}>
                <span className="action-icon">💬</span>
                <span className="action-text">{item.commentCount || 0}</span>
              </div>
              <div className="action-item" onClick={(e) => handleBookmark(item.id, e)}>
                <span className="action-icon">{bookmarkIds.includes(item.id) ? '⭐' : '☆'}</span>
                <span className="action-text">收藏</span>
              </div>
              <div className="action-item" onClick={(e) => handleShare(item, e)}>
                <span className="action-icon">↗️</span>
                <span className="action-text">分享</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
