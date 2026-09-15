import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { translationMock } from '../mock/tools';
import { useToast } from '../components/Toast';
import './Translation.css';

export default function Translation() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('zh2en');
  const [loading, setLoading] = useState(false);

  const modes = [
    { key: 'zh2en', label: '中译英' },
    { key: 'en2zh', label: '英译中' },
    { key: 'academic', label: '学术润色' },
    { key: 'casual', label: '口语化表达' },
  ];

  function handleTranslate() {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    // simulate delay
    setTimeout(() => {
      if (input.trim().length > 0) {
        setOutput(translationMock[mode]?.output || '演示翻译结果：' + input.split('').reverse().join(''));
      }
      setLoading(false);
    }, 500);
  }

  return (
    <div className="tr-container">
      <div className="tr-header" onClick={() => navigate(-1)}>
        <span className="tr-back">‹ 返回工具箱</span>
        <span className="tr-title">🌐 中英互译</span>
      </div>

      <div className="tr-modes">
        {modes.map((m) => (
          <span key={m.key} className={`tr-mode ${mode === m.key ? 'active' : ''}`} onClick={() => setMode(m.key)}>{m.label}</span>
        ))}
      </div>

      <textarea className="tr-textarea" placeholder={mode === 'en2zh' ? '输入英文...' : '输入中文...'} value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="tr-btn" onClick={handleTranslate} disabled={loading}>{loading ? '翻译中...' : '开始翻译'}</button>

      {output && (
        <div className="tr-output">
          <div className="tr-output-hd">
            <span>翻译结果</span>
            <button className="tr-copy" onClick={() => { navigator.clipboard.writeText(output); showToast('已复制', 'success'); }}>📋</button>
          </div>
          <p className="tr-output-text">{output}</p>
        </div>
      )}

      <div className="tr-notice">⚠️ 当前为演示版，可后续接入大模型 API</div>
    </div>
  );
}
