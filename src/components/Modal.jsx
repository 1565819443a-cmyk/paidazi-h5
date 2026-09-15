import './Modal.css';

export default function Modal({ title, content, onConfirm, onCancel, showCancel = true, confirmText = '确定', cancelText = '取消' }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-content">{content}</div>
        <div className="modal-actions">
          {showCancel && (
            <button className="modal-btn cancel" onClick={onCancel}>{cancelText}</button>
          )}
          <button className="modal-btn confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
