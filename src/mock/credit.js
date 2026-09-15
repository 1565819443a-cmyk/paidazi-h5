export const creditRules = {
  levels: [
    { min: 90, level: '优秀', badge: '靠谱搭子', color: '#2ecc71' },
    { min: 80, level: '良好', badge: '守约用户', color: '#3498db' },
    { min: 60, level: '一般', badge: '', color: '#f39c12' },
    { min: 0, level: '待提升', badge: '信用待提升', color: '#e74c3c' },
  ],
  dimensions: [
    { key: 'punctuality', name: '守约记录', score: 90, desc: '按时参加约定活动', icon: '✅' },
    { key: 'response', name: '回复效率', score: 85, desc: '及时回复消息和邀请', icon: '💬' },
    { key: 'feedback', name: '互动评价', score: 88, desc: '来自搭子的评价反馈', icon: '⭐' },
    { key: 'community', name: '社区行为', score: 92, desc: '发布真实有效信息', icon: '🌱' },
    { key: 'profile', name: '资料完整度', score: 95, desc: '完善个人信息和标签', icon: '📋' },
  ],
  actions: [
    { type: 'positive', reason: '完成一次学习搭子约定', score: 3 },
    { type: 'positive', reason: '按时参加竞赛组队讨论', score: 5 },
    { type: 'positive', reason: '获得搭子好评', score: 2 },
    { type: 'positive', reason: '发布真实有效的组队信息', score: 2 },
    { type: 'positive', reason: '完善个人标签资料', score: 1 },
    { type: 'negative', reason: '取消预约过晚', score: -3 },
    { type: 'negative', reason: '被举报后确认违规', score: -10 },
    { type: 'negative', reason: '发布虚假信息', score: -5 },
    { type: 'negative', reason: '长期不回复消息', score: -2 },
  ],
  benefits: [
    { level: '优秀', benefits: ['优先展示在推荐列表中', 'AI推荐权重 ×2', '可创建更多组队帖子', '获得"靠谱搭子"徽章', '申请队伍时展示信用标签'] },
    { level: '良好', benefits: ['优先展示在推荐列表中', 'AI推荐权重 ×1.5', '获得"守约用户"徽章'] },
    { level: '一般', benefits: ['正常使用平台功能', '可通过完善资料和守约提升信'] },
    { level: '待提升', benefits: ['部分功能受限', '完善资料和守约后可恢复'] },
  ],
};

export function getCreditLevel(score) {
  return creditRules.levels.find((l) => score >= l.min) || creditRules.levels[creditRules.levels.length - 1];
}
