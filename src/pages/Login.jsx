import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isCampusEmail } from '../lib/supabaseClient';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError(''); setMessage('');
    if (!isCampusEmail(email)) {
      setError('试点账号请使用西电校内邮箱（xidian.edu.cn）');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 位');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        navigate('/index', { replace: true });
      } else {
        const data = await signUp(email.trim(), password);
        if (data.session) navigate('/index', { replace: true });
        else setMessage('注册成功，请到校内邮箱完成验证后再登录。');
      }
    } catch (err) {
      const text = err?.message || '账号服务暂时不可用';
      setError(text.includes('Invalid login credentials') ? '邮箱或密码错误' : text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-logo">π</span>
        <span className="login-name">π搭子校内试点</span>
        <span className="login-desc">真实账号用于发布、邀请、审核和跨设备同步</span>
      </div>

      <div className="login-panel">
        <div className="login-tabs">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>登录</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>注册试点账号</button>
        </div>
        <form onSubmit={submit}>
          <label className="login-label" htmlFor="campus-email">西电校内邮箱</label>
          <input id="campus-email" className="login-input" type="email" autoComplete="email" value={email}
            onChange={(event) => setEmail(event.target.value)} placeholder="name@stu.xidian.edu.cn" />
          <label className="login-label login-password-label" htmlFor="campus-password">密码</label>
          <input id="campus-password" className="login-input" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 位" />
          {error && <div className="login-alert error">{error}</div>}
          {message && <div className="login-alert success">{message}</div>}
          <button className="login-primary" type="submit" disabled={loading}>
            {loading ? '处理中…' : mode === 'signin' ? '登录校内试点' : '注册并验证邮箱'}
          </button>
        </form>
        <div className="login-divider"><span>答辩或网络异常</span></div>
        <button className="login-demo" onClick={() => navigate('/index', { replace: true })}>进入演示模式</button>
        <p className="login-note">演示模式数据只保存在当前浏览器；真实试点账号的数据按用户隔离，不公开手机号、宿舍号等敏感信息。</p>
      </div>
    </div>
  );
}
