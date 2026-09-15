import { useNavigate } from 'react-router-dom';
import './ChatDetail.css';

export default function ChatDetail() {
  const navigate = useNavigate();

  return (
    <div className="cd-container">
      <div className="cd-topbar">
        <span className="cd-back-btn" onClick={() => navigate(-1)}>‹</span>
        <div className="cd-top-info">
          <span className="cd-top-name">真实聊天未开启</span>
          <div className="cd-top-meta">
            <span className="cd-top-credit">当前版本只保留真实邀请记录</span>
          </div>
        </div>
      </div>

      <div className="cd-messages">
        <div className="cd-msg other">
          <div className="cd-msg-row">
            <div className="cd-bubble">
              这里不会再显示模拟聊天。你可以在“我的邀请”里查看真实邀请记录，后续如果要做站内私信，可以继续接一张真实消息表。
            </div>
          </div>
        </div>
      </div>

      <div className="cd-tip">真实数据版已去掉自动回复和虚拟聊天记录。</div>
    </div>
  );
}
