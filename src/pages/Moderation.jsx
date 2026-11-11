import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchModerationQueue, moderateItem } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Moderation.css';

export default function Moderation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [queue, setQueue] = useState({ demands: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setError('请先登录试点账号'); setLoading(false); return; }
    setLoading(true); setError('');
    try { setQueue(await fetchModerationQueue()); }
    catch (err) { setError(err.message || '无法加载审核队列'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    // Loading the remote moderation queue is the synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function decide(type, id, status) {
    try {
      await moderateItem(type, id, status);
      setQueue((current) => ({
        ...current,
        demands: type === 'demand' ? current.demands.filter((item) => item.id !== id) : current.demands,
        reports: type === 'report' ? current.reports.filter((item) => item.id !== id) : current.reports,
      }));
      showToast('审核结果已保存', 'success');
    } catch (err) { showToast(err.message || '审核失败'); }
  }

  return (
    <div className="moderation-page">
      <header className="moderation-header">
        <button onClick={() => navigate('/profile')}>‹ 返回</button>
        <div><h1>内容审核</h1><p>只有配置为审核员的账号可以访问</p></div>
      </header>
      {loading && <div className="moderation-state">正在加载审核队列…</div>}
      {!loading && error && <div className="moderation-state error">{error}<button onClick={load}>重试</button></div>}
      {!loading && !error && (
        <>
          <section>
            <h2>待审核需求 <span>{queue.demands.length}</span></h2>
            {queue.demands.map((item) => (
              <article className="moderation-card" key={item.id}>
                <strong>{item.title}</strong><p>{item.description}</p>
                <small>{item.category} · {new Date(item.created_at).toLocaleString()}</small>
                <div className="moderation-actions">
                  <button className="reject" onClick={() => decide('demand', item.id, 'rejected')}>拒绝</button>
                  <button className="approve" onClick={() => decide('demand', item.id, 'approved')}>通过</button>
                </div>
              </article>
            ))}
            {!queue.demands.length && <div className="moderation-empty">暂无待审核需求</div>}
          </section>
          <section>
            <h2>用户举报 <span>{queue.reports.length}</span></h2>
            {queue.reports.map((item) => (
              <article className="moderation-card" key={item.id}>
                <strong>{item.target_type} · {item.target_id}</strong><p>{item.reason}</p>
                <div className="moderation-actions">
                  <button className="reject" onClick={() => decide('report', item.id, 'rejected')}>驳回</button>
                  <button className="approve" onClick={() => decide('report', item.id, 'resolved')}>已处理</button>
                </div>
              </article>
            ))}
            {!queue.reports.length && <div className="moderation-empty">暂无待处理举报</div>}
          </section>
        </>
      )}
    </div>
  );
}
