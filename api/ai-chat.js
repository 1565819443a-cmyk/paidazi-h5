export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AI_API_KEY = process.env.AI_API_KEY;
  if (!AI_API_KEY) {
    return res.status(500).json({ error: 'AI API Key 未配置' });
  }

  const body = req.body;
  const stream = body.stream !== false;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: body.messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 4096,
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
}
