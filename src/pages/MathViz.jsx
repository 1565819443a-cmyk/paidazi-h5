import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mathFunctions } from '../mock/tools';
import './MathViz.css';

const W = 300, H = 300, PAD = 30;

export default function MathViz() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(mathFunctions[0]);
  const canvasRef = useRef(null);

  useEffect(() => { draw(); }, [selected]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    const xMin = selected.xMin, xMax = selected.xMax;
    const toX = (x) => PAD + ((x - xMin) / (xMax - xMin)) * (W - 2 * PAD);
    const toY = (y) => H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD);

    let yMin = Infinity, yMax = -Infinity;
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * (i / 200);
      let y;
      try { y = selected.fn(x); } catch { continue; }
      if (isNaN(y) || !isFinite(y) || Math.abs(y) > 100) continue;
      yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
      pts.push({ x, y });
    }
    if (yMin === Infinity) { yMin = -5; yMax = 5; }
    const padY = (yMax - yMin) * 0.1 || 1;
    yMin -= padY; yMax += padY;

    ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();

    ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const sx = ((pts[i].x - xMin) / (xMax - xMin)) * (W - 2 * PAD) + PAD;
      const sy = H - PAD - ((pts[i].y - yMin) / (yMax - yMin)) * (H - 2 * PAD);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  return (
    <div className="mv-container">
      <div className="mv-header" onClick={() => navigate(-1)}>
        <span className="mv-back">‹ 返回工具箱</span>
        <span className="mv-title">📈 数学可视化</span>
      </div>

      <div className="mv-funcs">
        {mathFunctions.map((f, i) => (
          <span key={i} className={`mv-func ${selected.name === f.name ? 'active' : ''}`} onClick={() => setSelected(f)}>{f.name}</span>
        ))}
      </div>

      <div className="mv-canvas-wrap">
        <canvas ref={canvasRef} className="mv-canvas" />
      </div>

      <div className="mv-info">
        <span className="mv-expr">{selected.name}</span>
        <span className="mv-desc">{selected.desc}</span>
      </div>
    </div>
  );
}
