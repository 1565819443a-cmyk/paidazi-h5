import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { canteenData } from '../mock/tools';
import './Canteen.css';

export default function Canteen() {
  const navigate = useNavigate();
  const [data] = useState(canteenData);
  const [filters, setFilters] = useState({ price: 'all', queue: 'all', rating: 'all' });

  const filtered = data.filter((d) => {
    if (filters.price === 'cheap' && d.price > 15) return false;
    if (filters.price === 'mid' && (d.price <= 15 || d.price > 20)) return false;
    if (filters.price === 'high' && d.price <= 20) return false;
    if (filters.queue === 'low' && d.queue !== '少') return false;
    if (filters.queue === 'high' && d.queue !== '多') return false;
    if (filters.rating === 'best' && d.rating < 4.5) return false;
    return true;
  });

  return (
    <div className="cn-container">
      <div className="cn-header" onClick={() => navigate(-1)}>
        <span className="cn-back">‹ 返回工具箱</span>
        <span className="cn-title">🍜 食堂推荐</span>
        <span className="cn-subtitle">帮你做午饭选择</span>
      </div>

      <div className="cn-demo-notice">菜单、价格、排队和评分为功能示例，请以食堂现场为准。</div>

      <div className="cn-filters">
        <div className="cn-filter-group">
          <span className="cn-filter-label">价格</span>
          {[{ k: 'all', l: '全部' }, { k: 'cheap', l: '¥15以下' }, { k: 'mid', l: '¥15-20' }, { k: 'high', l: '¥20+' }].map((o) => (
            <span key={o.k} className={`cn-filter-item ${filters.price === o.k ? 'active' : ''}`} onClick={() => setFilters({ ...filters, price: o.k })}>{o.l}</span>
          ))}
        </div>
        <div className="cn-filter-group">
          <span className="cn-filter-label">排队</span>
          {[{ k: 'all', l: '全部' }, { k: 'low', l: '人少' }, { k: 'high', l: '人气' }].map((o) => (
            <span key={o.k} className={`cn-filter-item ${filters.queue === o.k ? 'active' : ''}`} onClick={() => setFilters({ ...filters, queue: o.k })}>{o.l}</span>
          ))}
        </div>
        <div className="cn-filter-group">
          <span className="cn-filter-label">评分</span>
          {[{ k: 'all', l: '全部' }, { k: 'best', l: '4.5分以上' }].map((o) => (
            <span key={o.k} className={`cn-filter-item ${filters.rating === o.k ? 'active' : ''}`} onClick={() => setFilters({ ...filters, rating: o.k })}>{o.l}</span>
          ))}
        </div>
      </div>

      <div className="cn-list">
        {filtered.map((d) => (
          <div key={d.id} className="cn-card">
            <div className="cn-card-hd">
              <span className="cn-dish">{d.dish}</span>
              <span className="cn-price">¥{d.price}</span>
            </div>
            <div className="cn-card-sub">
              <span>{d.name} · {d.window}</span>
            </div>
            <div className="cn-tags">
              {d.tags.map((t, i) => <span key={i} className="cn-tag">{t}</span>)}
              <span className="cn-queue">排队：{d.queue}</span>
              <span className="cn-rating">⭐{d.rating}</span>
              <span className="cn-dist">📍{d.distance}</span>
            </div>
            <div className="cn-reason">💡 {d.reason}</div>
            <button className="cn-meal-btn" onClick={() => navigate('/index')}>找约饭搭子 🍽️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
