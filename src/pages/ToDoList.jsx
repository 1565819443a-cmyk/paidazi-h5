import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import todoService from '../services/todoService';
import './ToDoList.css';

const CATEGORIES = ['全部', '四六级', '考研', '作业', '论文', '竞赛', '健身', '阅读'];

export default function ToDoList() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState(() => todoService.getAll());
  const [filter, setFilter] = useState('全部');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: '作业', deadline: '', importance: 'medium' });

  const filtered = todos.filter((t) => {
    if (filter === '全部') return true;
    if (filter === '今日') return t.deadline === new Date().toISOString().slice(0, 10);
    if (filter === '未完成') return !t.done;
    if (filter === '已完成') return t.done;
    return t.category === filter;
  });

  function handleAdd() {
    if (!form.title.trim()) return;
    setTodos(todoService.add({ title: form.title, category: form.category, deadline: form.deadline, importance: form.importance }));
    setForm({ title: '', category: '作业', deadline: '', importance: 'medium' });
    setShowAdd(false);
  }

  function handleToggle(id) {
    setTodos(todoService.toggle(id));
  }

  function handleRemove(id) {
    setTodos(todoService.remove(id));
  }

  const doneCount = todos.filter((t) => t.done).length;
  const todayCount = todos.filter((t) => !t.done && t.deadline === new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="td-container">
      <div className="td-header" onClick={() => navigate(-1)}>
        <span className="td-back">‹ 返回</span>
        <span className="td-title">✅ 学习清单</span>
        <div className="td-stats">
          <span className="td-stat">今日 {todayCount}</span>
          <span className="td-stat">已完成 {doneCount}</span>
          <span className="td-stat">总计 {todos.length}</span>
        </div>
      </div>

      <button className="td-add-btn" onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? '取消' : '＋ 新增任务'}
      </button>

      {showAdd && (
        <div className="td-form">
          <input className="td-input" placeholder="任务标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="td-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="td-form-row">
            <input className="td-input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <select className="td-select" value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })}>
              <option value="high">🔴 重要</option>
              <option value="medium">🟡 一般</option>
              <option value="low">🟢 不急</option>
            </select>
          </div>
          <button className="td-submit" onClick={handleAdd}>确认添加</button>
        </div>
      )}

      <div className="td-filters">
        {['全部', '今日', '未完成', '已完成'].map((f) => (
          <span key={f} className={`td-filter-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</span>
        ))}
      </div>

      <div className="td-filters" style={{ flexWrap: 'wrap' }}>
        {CATEGORIES.slice(1).map((c) => (
          <span key={c} className={`td-filter-item small ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</span>
        ))}
      </div>

      <div className="td-list">
        {filtered.length === 0 ? (
          <div className="td-empty">暂无任务，添加一个今日小目标吧 📝</div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className={`td-item ${t.done ? 'done' : ''}`}>
              <div className={`td-check ${t.done ? 'checked' : ''}`} onClick={() => handleToggle(t.id)}>
                {t.done ? '✅' : '⭕'}
              </div>
              <div className="td-content">
                <span className="td-item-title">{t.title}</span>
                <div className="td-item-meta">
                  <span className={`td-importance ${t.importance}`}>{t.importance === 'high' ? '🔴' : t.importance === 'medium' ? '🟡' : '🟢'}</span>
                  <span className="td-cat">{t.category}</span>
                  {t.deadline && <span className="td-deadline">📅 {t.deadline}</span>}
                </div>
              </div>
              <span className="td-delete" onClick={() => handleRemove(t.id)}>🗑️</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
