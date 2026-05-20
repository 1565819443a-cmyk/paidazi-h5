import { useState, useRef, useEffect } from 'react';
import { aiChat } from '../utils/ai';
import { getProfile } from '../utils/user';
import './AiChat.css';

const SUGGESTIONS = [
  '期末复习好焦虑怎么办',
  '推荐几个校园美食',
  '怎么找到靠谱学习搭子',
  '今天心情不好想吐槽',
  '帮我写一段树洞投稿',
  '大学怎么交到好朋友',
];

export default function AiChat() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: '嗨！我是你的AI搭子小π 🎓✨ 学习累了找我聊天、想找人约饭我帮你出主意、心情不好也可以跟我说～今天想聊什么？' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const profile = getProfile();

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const content = (text || input.trim());
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Add placeholder for AI response
    setMessages((prev) => [...prev, { role: 'ai', content: '', typing: true }]);

    try {
      const history = [...messages, userMsg]
        .filter((m) => !m.typing && m.content)
        .map((m) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content,
        }))
        .slice(-10);

      const reply = await aiChat('companion', history);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', content: reply };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', content: '哎呀，我好像卡住了😵 请检查AI API Key是否已配置，或者稍后再试～' };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="aichat-container">
      <div className="aichat-header">
        <span className="aichat-title">🤖 AI 聊天搭子 · 小π</span>
        <span className="aichat-subtitle">你的校园AI伙伴</span>
      </div>

      <div className="aichat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`aichat-msg ${msg.role}`}>
            <div className="aichat-msg-avatar">
              {msg.role === 'ai' ? '🤖' : '👤'}
            </div>
            <div className="aichat-msg-bubble">
              {msg.typing ? (
                <span className="aichat-typing">小π正在思考...</span>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="aichat-empty">
            <span className="aichat-empty-icon">💬</span>
            <span className="aichat-empty-text">试试这些话题：</span>
            <div className="aichat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <span key={i} className="aichat-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      <div className="aichat-input-area">
        <input
          className="aichat-input"
          placeholder="和AI小π聊聊天..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="aichat-send"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
