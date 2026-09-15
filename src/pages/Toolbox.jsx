import { useNavigate } from 'react-router-dom';
import './Toolbox.css';

const tools = [
  { icon: '📈', title: '数学可视化', desc: '查看常见函数图像，理解数学概念', to: '/math-viz', color: '#3498db' },
  { icon: '📐', title: 'LaTeX 助手', desc: '论文公式模板和排版示例', to: '/latex-helper', color: '#9b59b6' },
  { icon: '🌐', title: '中英互译', desc: '论文摘要、校园帖子翻译辅助', to: '/translation', color: '#2ecc71' },
  { icon: '🍜', title: '食堂推荐', desc: '看看今天吃什么', to: '/canteen', color: '#e67e22' },
  { icon: '✅', title: '学习清单', desc: '今日任务和提醒', to: '/todolist', color: '#e74c3c' },
];

export default function Toolbox() {
  const navigate = useNavigate();

  return (
    <div className="tb-container">
      <div className="tb-header" onClick={() => navigate(-1)}>
        <span className="tb-back">‹ 返回</span>
        <span className="tb-title">🧰 校园工具箱</span>
        <span className="tb-subtitle">学习生活实用工具</span>
      </div>

      <div className="tb-grid">
        {tools.map((t) => (
          <div key={t.to} className="tb-card" onClick={() => navigate(t.to)} style={{ borderTop: `min(1vw, 4.8px) solid ${t.color}` }}>
            <span className="tb-icon">{t.icon}</span>
            <span className="tb-card-title">{t.title}</span>
            <span className="tb-card-desc">{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
