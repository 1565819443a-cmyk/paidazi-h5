import { useState } from 'react';
import './ShareSheet.css';

export function useShare() {
  const [visible, setVisible] = useState(false);

  function share(title, path) {
    const url = window.location.origin + window.location.pathname + '#' + path;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制到剪贴板，分享给好友吧！');
      }).catch(() => {
        setVisible(true);
      });
    }
  }

  return { share, visible, setVisible };
}

export default function ShareSheet({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="sharesheet-overlay" onClick={onClose}>
      <div className="sharesheet-box" onClick={(e) => e.stopPropagation()}>
        <div className="sharesheet-title">分享到</div>
        <div className="sharesheet-grid">
          <div className="sharesheet-item" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('链接已复制，去微信粘贴即可');
            onClose();
          }}>
            <span className="sharesheet-icon">💬</span>
            <span>微信好友</span>
          </div>
          <div className="sharesheet-item" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('链接已复制');
            onClose();
          }}>
            <span className="sharesheet-icon">🔗</span>
            <span>复制链接</span>
          </div>
        </div>
        <button className="sharesheet-cancel" onClick={onClose}>取消</button>
      </div>
    </div>
  );
}
