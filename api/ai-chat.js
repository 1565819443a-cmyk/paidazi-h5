export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AI_API_KEY = process.env.AI_API_KEY;
  if (!AI_API_KEY) {
    return res.status(500).json({ error: 'AI API Key 未配置' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: req.body.messages,
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.max_tokens || 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'AI 请求失败' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'AI 服务异常: ' + err.message });
  }
}
