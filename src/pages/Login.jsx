import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { enterWithNickname } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const value = nickname.trim();
    if (value.length < 2 || value.length > 16) {
      setError('请输入 2–16 个字的昵称');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await enterWithNickname(value);
      navigate('/index', { replace: true });
    } catch (err) {
      setError(err?.message || '进入失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-logo">π</span>
        <span className="login-name">π搭子</span>
        <span className="login-desc">输入昵称即可进入，发布、分享并邀请真实搭子</span>
      </div>

      <div className="login-panel">
        <form onSubmit={submit}>
          <label className="login-label" htmlFor="nickname">你的昵称</label>
          <input id="nickname" className="login-input" value={nickname} maxLength={16}
            onChange={(event) => setNickname(event.target.value)} placeholder="例如：高数冲刺小π" autoFocus />
          {error && <div className="login-alert error">{error}</div>}
          <button className="login-primary" type="submit" disabled={loading}>
            {loading ? '正在进入…' : '进入 π搭子'}
          </button>
        </form>
        <div className="login-feature-list">
          <span>✓ 发布内容后其他用户可以看到</span>
          <span>✓ 分享链接给同学直接打开</span>
          <span>✓ 双方互邀、接受后站内聊天</span>
        </div>
        <button className="login-demo" onClick={() => navigate('/index', { replace: true })}>网络异常时进入演示模式</button>
        <p className="login-note">当前为免邮箱试用身份，保存在本浏览器中。清除浏览器数据或更换设备后会生成新身份，请勿在聊天中发送敏感个人信息。</p>
      </div>
    </div>
  );
}
