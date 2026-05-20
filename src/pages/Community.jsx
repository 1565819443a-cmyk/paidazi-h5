import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchPosts, likePost } from '../utils/supabase';
import { toggleBookmark, isBookmarked } from '../utils/user';
import { aiChat, buildCommunityPrompt } from '../utils/ai';
import { useToast } from '../components/Toast';
import { useShare } from '../components/ShareSheet';
import './Community.css';

const SAMPLE_POSTS = [
  { id: 'info1', category: 'info', categoryName: '校园资讯', nickname: '西安电子科技大学', avatar: 'https://randomuser.me/api/portraits/lego/2.jpg', time: '官网', content: '🏫 西安电子科技大学官方网站 - 学校概况、新闻动态、招生就业等信息', likes: 345, commentCount: 56, url: 'https://www.xidian.edu.cn', linkText: '访问官网' },
  { id: 'info2', category: 'info', categoryName: '校园资讯', nickname: '教务处', avatar: 'https://randomuser.me/api/portraits/lego/3.jpg', time: '教务系统', content: '📚 教务处官网 - 选课、成绩查询、考试安排、学籍管理', likes: 289, commentCount: 34, url: 'http://jwc.xidian.edu.cn', linkText: '进入教务系统' },
  { id: 'info3', category: 'info', categoryName: '校园资讯', nickname: '学工处', avatar: 'https://randomuser.me/api/portraits/lego/4.jpg', time: '学生工作', content: '👨‍🎓 学生工作处 - 奖学金、助学金、思政教育、学生管理', likes: 167, commentCount: 23, url: 'https://xgc.xidian.edu.cn', linkText: '查看详情' },
  { id: 'info4', category: 'info', categoryName: '校园资讯', nickname: '图书馆', avatar: 'https://randomuser.me/api/portraits/lego/5.jpg', time: '图书馆', content: '📖 图书馆官网 - 馆藏查询、数字资源、座位预约、开放时间', likes: 234, commentCount: 45, url: 'https://library.xidian.edu.cn', linkText: '访问图书馆' },
  { id: 'info5', category: 'info', categoryName: '校园资讯', nickname: '研究生院', avatar: 'https://randomuser.me/api/portraits/lego/6.jpg', time: '研究生教育', content: '🎓 研究生院 - 招生信息、培养方案、学位管理、导师信息', likes: 198, commentCount: 27, url: 'https://gr.xidian.edu.cn', linkText: '查看详情' },
  { id: 'info6', category: 'info', categoryName: '校园资讯', nickname: '就业指导中心', avatar: 'https://randomuser.me/api/portraits/lego/7.jpg', time: '就业信息', content: '💼 就业信息网 - 招聘信息、职业测评、就业指导、宣讲会安排', likes: 276, commentCount: 52, url: 'https://job.xidian.edu.cn', linkText: '查看招聘信息' },
  { id: 'p1', category: 'note', categoryName: '学习笔记', nickname: '考研小王子', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', time: '10分钟前', content: '高数期末复习重点总结，需要的同学自取！', likes: 34, commentCount: 12 },
  { id: 'p2', category: 'food', categoryName: '美食测评', nickname: '干饭先锋', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', time: '30分钟前', content: '二食堂麻辣香锅真的绝了！人均25，量超大', likes: 56, commentCount: 8 },
  { id: 'p3', category: 'lost', categoryName: '失物招领', nickname: '热心同学', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', time: '1小时前', content: '图书馆捡到学生卡，李华同学请联系我', likes: 23, commentCount: 5 },
  { id: 'p4', category: 'treehole', categoryName: '树洞', nickname: '匿名', avatar: 'https://randomuser.me/api/portraits/lego/1.jpg', time: '2小时前', content: '期末好焦虑，有人一起通宵复习吗？', likes: 67, commentCount: 23 },
  { id: 'p5', category: 'secondhand', categoryName: '二手交易', nickname: '毕业学长', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', time: '3小时前', content: '高数上册教材，9成新，15元出', likes: 12, commentCount: 4 },
];

export default function Community() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { share } = useShare();

  const [currentTab, setCurrentTab] = useState('recommend');
  const [allPosts, setAllPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const tabs = [
    { key: 'recommend', label: '🔥 推荐' },
    { key: 'info', label: '📢 资讯' },
    { key: 'note', label: '📚 学习' },
    { key: 'food', label: '🍔 美食' },
    { key: 'lost', label: '🔍 失物' },
    { key: 'treehole', label: '💭 树洞' },
    { key: 'secondhand', label: '🛒 二手' },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      let posts = await fetchPosts();
      if (posts.length === 0) {
        await seedPosts();
        posts = await fetchPosts();
      }
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

  async function seedPosts() {
    for (const p of SAMPLE_POSTS) {
      await supabase.from('community_posts').insert({
        id: p.id,
        category: p.category,
        category_name: p.categoryName,
        nickname: p.nickname,
        avatar: p.avatar,
        content: p.content,
        likes: p.likes,
        comments_count: p.commentCount || 0,
        url: p.url || null,
        link_text: p.linkText || null,
        created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      });
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
    try {
      await likePost(id);
      const updated = allPosts.map((p) =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
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

  function handleBookmark(id, e) {
    e.stopPropagation();
    const added = toggleBookmark(id);
    showToast(added ? '已收藏' : '已取消收藏', 'success');
  }

  function handleShare(post, e) {
    e.stopPropagation();
    const title = `${post.nickname}：${(post.content || '').substring(0, 20)}...`;
    share(title, `/comment?postId=${post.id}`);
  }

  return (
    <div className="community-container">
      <div className="comm-header">
        <span className="comm-title">🌱 校园社区</span>
        <span className="comm-subtitle">分享你的校园生活</span>
      </div>

      <div className="publish-card" onClick={() => navigate('/publish')}>
        <img className="publish-avatar" src="https://randomuser.me/api/portraits/lego/1.jpg" alt="" />
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

      <div style={{ padding: '0 1vw 4vw' }}>
        <div
          onClick={handleAiSummary}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '3.2vw',
            padding: '3vw 4vw',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '5.3vw', marginRight: '3vw' }}>🤖</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '4.2vw', fontWeight: 600, display: 'block' }}>AI 社区管家</span>
            <span style={{ fontSize: '3.2vw', opacity: 0.8 }}>点击查看今日热门话题和推荐</span>
          </div>
          <span style={{ fontSize: '4vw' }}>›</span>
        </div>

        {aiSummary && (
          <div style={{
            background: '#fff',
            borderRadius: '3.2vw',
            padding: '4vw',
            marginTop: '3vw',
            border: '1px solid #e8d5f5',
            fontSize: '3.7vw',
            color: '#2c3e50',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2vw' }}>
              <span style={{ fontSize: '4.2vw', fontWeight: 600, color: '#764ba2' }}>📊 AI 社区分析</span>
              <span style={{ fontSize: '3.2vw', color: '#999', cursor: 'pointer' }} onClick={() => setAiSummary('')}>✕</span>
            </div>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '3vw', color: '#999' }}>AI正在分析社区内容...</div>
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
            if (item.category === 'info') return;
            navigate(`/comment?postId=${item.id}`);
          }}>
            <div className="post-header">
              <img className="post-avatar" src={item.avatar} alt="" />
              <div className="post-user">
                <span className="post-nickname">{item.nickname}</span>
                <span className="post-time">{item.time}</span>
              </div>
              <div className={`post-cat ${item.category}`}>{item.categoryName}</div>
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
                <span className="action-icon">{isBookmarked(item.id) ? '⭐' : '☆'}</span>
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
