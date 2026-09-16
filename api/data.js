/* global process */

const TABLES = {
  posts: 'community_posts',
  comments: 'comments',
  demands: 'demands',
  invites: 'invites',
};

function queryValue(value) {
  return encodeURIComponent(String(value));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Data service is not configured' });

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  async function request(path, options = {}) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
      signal: AbortSignal.timeout(4000),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.message || data?.error || `Data service returned ${response.status}`);
    return data;
  }

  try {
    const { action, payload = {} } = req.body || {};
    let data;

    switch (action) {
      case 'listPosts':
        data = await request(`${TABLES.posts}?select=*&order=created_at.desc`);
        break;
      case 'getPost':
        data = (await request(`${TABLES.posts}?select=*&id=eq.${queryValue(payload.id)}&limit=1`))?.[0] || null;
        break;
      case 'createPost':
        data = (await request(TABLES.posts, { method: 'POST', body: JSON.stringify(payload) }))?.[0] || null;
        break;
      case 'likePost':
        data = await request('rpc/increment_likes', { method: 'POST', body: JSON.stringify({ post_id: payload.id }) });
        break;
      case 'listComments':
        data = await request(`${TABLES.comments}?select=*&post_id=eq.${queryValue(payload.postId)}&parent_id=is.null&order=created_at.desc`);
        break;
      case 'listReplies':
        data = await request(`${TABLES.comments}?select=*&parent_id=eq.${queryValue(payload.commentId)}&order=created_at.asc`);
        break;
      case 'createComment': {
        data = (await request(TABLES.comments, { method: 'POST', body: JSON.stringify(payload.comment) }))?.[0] || null;
        await request('rpc/increment_comments_count', { method: 'POST', body: JSON.stringify({ post_id: payload.comment.post_id }) });
        break;
      }
      case 'listDemands':
        data = await request(`${TABLES.demands}?select=*&order=created_at.desc`);
        break;
      case 'createDemand':
        data = (await request(TABLES.demands, { method: 'POST', body: JSON.stringify(payload) }))?.[0] || null;
        break;
      case 'createInvite':
        data = (await request(TABLES.invites, { method: 'POST', body: JSON.stringify(payload) }))?.[0] || null;
        break;
      case 'listInvites':
        data = await request(`${TABLES.invites}?select=*&order=created_at.desc`);
        break;
      case 'postsByIds': {
        const ids = Array.isArray(payload.ids) ? payload.ids.slice(0, 100) : [];
        data = ids.length ? await request(`${TABLES.posts}?select=*&id=in.(${ids.map(queryValue).join(',')})&order=created_at.desc`) : [];
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown data action' });
    }

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Data service unavailable' });
  }
}
