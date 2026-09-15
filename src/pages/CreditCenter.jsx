import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import creditService from '../services/creditService';
import { getCreditLevelInfo, getCreditBadge } from '../utils/creditUtils';
import { creditRules } from '../mock/credit';
import './CreditCenter.css';

export default function CreditCenter() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => creditService.getData());
  const level = getCreditLevelInfo(data.score);

  function handleAction(reason, delta) {
    const updated = creditService.addRecord(reason, delta);
    setData({ ...updated });
  }

  return (
    <div className="cc-container">
      <div className="cc-header" onClick={() => navigate(-1)}>
        <span className="cc-back">‹ 返回</span>
        <span className="cc-title">信用中心 · 机制演示</span>
      </div>

      <div className="cc-score-card" style={{ background: `linear-gradient(135deg, ${level.color}22, ${level.color}44)` }}>
        <div className="cc-score-big">{data.score}</div>
        <div className="cc-score-level" style={{ color: level.color }}>{level.level} · {getCreditBadge(data.score)}</div>
        <div className="cc-score-desc">评分规则原型，仅用于演示守约激励机制，不代表真实信用评价</div>
      </div>

      <div className="cc-section-title">📊 信用维度</div>
      <div className="cc-dimensions">
        {data.dimensions.map((d) => (
          <div key={d.key} className="cc-dim-item">
            <div className="cc-dim-hd">
              <span className="cc-dim-name">{d.icon} {d.name}</span>
              <span className="cc-dim-score">{d.score}分</span>
            </div>
            <div className="cc-progress"><div className="cc-progress-fill" style={{ width: d.score + '%', background: d.score >= 80 ? '#2ecc71' : d.score >= 60 ? '#f39c12' : '#e74c3c' }} /></div>
            <span className="cc-dim-desc">{d.desc}</span>
          </div>
        ))}
      </div>

      <div className="cc-section-title">📋 信用记录</div>
      <div className="cc-records">
        {data.logs.length === 0 && <div className="cc-record-item">暂无真实履约记录，可在下方体验评分变化</div>}
        {data.logs.map((log, i) => (
          <div key={i} className="cc-record-item">
            <div className="cc-record-hd">
              <span className="cc-record-reason">{log.reason}</span>
              <span className={`cc-record-score ${log.type}`}>{log.score > 0 ? '+' : ''}{log.score}</span>
            </div>
            <span className="cc-record-time">{log.time}</span>
          </div>
        ))}
      </div>

      <div className="cc-section-title">🎁 信用权益</div>
      <div className="cc-benefits">
        {(creditRules.benefits.find((b) => b.level === level.level)?.benefits || []).map((b, i) => (
          <div key={i} className="cc-benefit-item">{b}</div>
        ))}
      </div>

      <div className="cc-section-title">🔧 演示功能</div>
      <div className="cc-demo-btns">
        {creditRules.actions.filter((a) => a.type === 'positive').slice(0, 3).map((a, i) => (
          <button key={i} className="cc-demo-btn positive" onClick={() => handleAction(a.reason, a.score)}>{a.reason} +{a.score}</button>
        ))}
        {creditRules.actions.filter((a) => a.type === 'negative').slice(0, 2).map((a, i) => (
          <button key={i} className="cc-demo-btn negative" onClick={() => handleAction(a.reason, a.score)}>{a.reason} {a.score}</button>
        ))}
      </div>

      <div className="cc-tip">演示规则：守约、友好、及时回复会提升体验分</div>
    </div>
  );
}
