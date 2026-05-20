import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageSync, setStorageSync } from '../utils/storage';
import { useToast } from '../components/Toast';
import './Personality.css';

export default function Personality() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [showResult, setShowResult] = useState(false);
  const [resultTags, setResultTags] = useState([]);
  const [resultDesc, setResultDesc] = useState('');

  useEffect(() => {
    const saved = getStorageSync('personality');
    if (saved && saved.q1) {
      const ok = window.confirm('你已经做过性格测试，要重新测试吗？');
      if (!ok) navigate('/index');
    }
  }, []);

  function select(question, option) {
    setAnswers((prev) => ({ ...prev, [question]: option }));
  }

  function nextStep() {
    const step = currentStep;
    const a = answers;
    if (step === 0 && !a.q1) { showToast('请选择一个选项'); return; }
    if (step === 1 && !a.q2) { showToast('请选择一个选项'); return; }
    setCurrentStep((s) => s + 1);
  }

  function prevStep() { setCurrentStep((s) => s - 1); }

  function submitTest() {
    const { q1, q2, q3 } = answers;
    if (!q1 || !q2 || !q3) { showToast('请完成所有题目'); return; }

    setStorageSync('personality', answers);

    const tags = [];
    let desc = '';

    if (q1 === 'A') { tags.push('专注学霸'); desc = '你喜欢安静专注的环境，追求高效率。'; }
    else if (q1 === 'B') { tags.push('交流达人'); desc = '你喜欢讨论交流，享受思维碰撞。'; }
    else { tags.push('随和派'); desc = '你适应力强，随和好相处。'; }

    if (q2 === 'A') { tags.push('早起鸟'); desc += ' 你是晨型人，清晨效率最高。'; }
    else if (q2 === 'B') { tags.push('正常作息'); desc += ' 你作息规律，白天精力充沛。'; }
    else { tags.push('夜猫子'); desc += ' 你是夜猫子，晚上思路最清晰。'; }

    if (q3 === 'A') { tags.push('相似偏好'); desc += ' 你希望找性格相似的搭子。'; }
    else if (q3 === 'B') { tags.push('互补偏好'); desc += ' 你喜欢和不同类型的人相处。'; }
    else { tags.push('随缘'); desc += ' 你看重缘分，不设限制。'; }

    setResultTags(tags);
    setResultDesc(desc);
    setShowResult(true);
  }

  const questions = [
    {
      q: '1. 你更喜欢哪种学习氛围？',
      options: [
        { key: 'A', icon: '🤫', title: '绝对安静', desc: '专注效率，不喜欢被打扰' },
        { key: 'B', icon: '🗣️', title: '可以讨论', desc: '互相解答，喜欢交流' },
        { key: 'C', icon: '🎵', title: '轻松氛围', desc: '有点背景音乐也没关系' },
      ],
    },
    {
      q: '2. 你的作息规律是？',
      options: [
        { key: 'A', icon: '🌅', title: '早睡早起', desc: '清晨效率最高' },
        { key: 'B', icon: '🌞', title: '正常作息', desc: '白天学习' },
        { key: 'C', icon: '🌙', title: '夜猫子', desc: '晚上思路清晰' },
      ],
    },
    {
      q: '3. 你希望搭子的性格？',
      options: [
        { key: 'A', icon: '🤝', title: '相似型', desc: '和我差不多，互相理解' },
        { key: 'B', icon: '🌈', title: '互补型', desc: '能带来新思路' },
        { key: 'C', icon: '😊', title: '都可以', desc: '看缘分，不挑' },
      ],
    },
  ];

  const qKeys = ['q1', 'q2', 'q3'];

  return (
    <div className="personality-container">
      <div className="per-header">
        <span className="per-title">🧠 性格小测试</span>
        <span className="per-subtitle">3道题帮你找到最合拍的搭子</span>
      </div>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${((currentStep + 1) / 3) * 100}%` }} />
        <span className="progress-text">{currentStep + 1}/3</span>
      </div>

      {currentStep < 3 && (
        <div className="question">
          <span className="q-text">{questions[currentStep].q}</span>
          <div className="options">
            {questions[currentStep].options.map((opt) => (
              <div
                key={opt.key}
                className={`option ${answers[qKeys[currentStep]] === opt.key ? 'selected' : ''}`}
                onClick={() => select(qKeys[currentStep], opt.key)}
              >
                <span className="option-icon">{opt.icon}</span>
                <div className="option-content">
                  <span className="option-title">{opt.title}</span>
                  <span className="option-desc">{opt.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="button-area">
        {currentStep > 0 && <button className="prev-btn" onClick={prevStep}>上一步</button>}
        {currentStep < 2 && <button className="next-btn" onClick={nextStep}>下一步</button>}
        {currentStep === 2 && <button className="submit-btn2" onClick={submitTest}>完成测试，开启π搭子</button>}
      </div>

      {showResult && (
        <div className="result" onClick={() => setShowResult(false)}>
          <div className="result-card" onClick={(e) => e.stopPropagation()}>
            <span className="result-title">🎉 你的π型人格</span>
            <div className="result-tags">
              {resultTags.map((tag, i) => <span key={i} className="result-tag">{tag}</span>)}
            </div>
            <p className="result-desc">{resultDesc}</p>
            <button className="back-btn" onClick={() => navigate('/index')}>开始找搭子</button>
          </div>
        </div>
      )}
    </div>
  );
}
