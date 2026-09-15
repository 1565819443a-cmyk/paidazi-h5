import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com';

// AI chat proxy (streaming support)
app.post('/api/ai/chat', async (req, res) => {
  if (!AI_API_KEY) {
    return res.status(500).json({ error: 'AI API Key 未配置，请在 .env 中设置 AI_API_KEY' });
  }

  const stream = req.body.stream !== false;

  try {
    const response = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: req.body.messages,
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.max_tokens || 4096,
        stream,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(response.status).json({ error: data.error?.message || 'AI 请求失败' });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
            } else {
              res.write(`data: ${data}\n\n`);
            }
          }
        }
      }
      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI 服务异常: ' + err.message });
    } else {
      res.end();
    }
  }
});

// Serve static files
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return;
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`π搭子 服务已启动: http://localhost:${PORT}`);
  if (!AI_API_KEY) console.log('⚠️  未配置 AI_API_KEY，AI 功能暂不可用');
  else console.log('✅ AI 功能已就绪 (流式输出已开启)');
});
