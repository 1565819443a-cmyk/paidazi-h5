import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-logo">π</span>
        <span className="login-name">π搭子真实版</span>
        <span className="login-desc">小范围内部体验入口</span>
      </div>

      <div className="login-panel">
        <button className="login-primary" onClick={() => navigate('/index', { replace: true })}>
          直接进入
        </button>
      </div>
    </div>
  );
}
