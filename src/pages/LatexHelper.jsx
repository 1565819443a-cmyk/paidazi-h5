import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { latexTemplates, paperExpressions } from '../mock/tools';
import { useToast } from '../components/Toast';
import './LatexHelper.css';

export default function LatexHelper() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');

  function handleCopy(code) {
    navigator.clipboard.writeText(code).then(() => showToast('已复制到剪贴板', 'success')).catch(() => showToast('复制失败，请手动复制'));
  }

  return (
    <div className="lh-container">
      <div className="lh-header" onClick={() => navigate(-1)}>
        <span className="lh-back">‹ 返回工具箱</span>
        <span className="lh-title">📐 LaTeX 助手</span>
        <span className="lh-subtitle">论文公式和排版参考</span>
      </div>

      <div className="lh-tabs">
        <span className={`lh-tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>公式模板</span>
        <span className={`lh-tab ${activeTab === 'expressions' ? 'active' : ''}`} onClick={() => setActiveTab('expressions')}>常用表达</span>
      </div>

      {activeTab === 'templates' && (
        <div className="lh-list">
          {latexTemplates.map((t) => (
            <div key={t.id} className="lh-card">
              <div className="lh-card-hd">
                <span className="lh-card-name">{t.name}</span>
                <span className="lh-card-desc">{t.desc}</span>
                <button className="lh-copy-btn" onClick={() => handleCopy(t.code)}>📋 复制</button>
              </div>
              <pre className="lh-code">{t.code}</pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'expressions' && (
        <div className="lh-list">
          {paperExpressions.map((e, i) => (
            <div key={i} className="lh-card">
              <div className="lh-card-hd">
                <span className="lh-card-name">{e.en}</span>
                <span className="lh-card-desc">{e.zh}</span>
                <button className="lh-copy-btn" onClick={() => handleCopy(e.sample)}>📋 复制</button>
              </div>
              <pre className="lh-code">{e.sample}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
