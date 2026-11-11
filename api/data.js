/* global process */

const TABLES = {
  posts: 'community_posts', comments: 'comments', demands: 'campus_demands',
  invites: 'campus_invites', profiles: 'campus_profiles', reports: 'campus_reports',
  moderators: 'campus_moderators', messages: 'campus_messages',
};

function queryValue(value) { return encodeURIComponent(String(value)); }
function asProfile(value) { return Array.isArray(value) ? (value[0] || {}) : (value || {}); }

function mapDemand(row) {
  const profile = asProfile(row.campus_profiles);
  const deadline = row.expires_at ? new Date(row.expires_at).toISOString().slice(0, 10) : '';
  return {
    id: row.id, category: row.category,
    category_name: row.category === 'contest' ? '竞赛' : row.category === 'study' ? '学习' : row.category,
    title: row.title, nickname: profile.nickname || '校内用户', avatar: profile.avatar || '/favicon.svg',
    user_id: row.owner_id,
    tags: [
      ...(row.skills || []),
      ...(row.missing_roles || []).map((role) => `缺：${role}`),
      row.available_time ? `时间：${row.available_time}` : '',
      deadline ? `截止：${deadline}` : '',
    ].filter(Boolean),
    contact: row.description || '', status: row.status,
    moderation_status: row.moderation_status, created_at: row.created_at,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Data service is not configured' });

  const incomingToken = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  const bearer = incomingToken || supabaseKey;
  const headers = {
    apikey: supabaseKey, Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json', Prefer: 'return=representation',
  };

  async function request(path, options = {}) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...options, headers: { ...headers, ...(options.headers || {}) }, signal: AbortSignal.timeout(6000),
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
    if (!response.ok) throw new Error(data?.message || data?.error || `Data service returned ${response.status}`);
    return data;
  }

  async function currentUser() {
    if (!incomingToken) return null;
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${incomingToken}` }, signal: AbortSignal.timeout(6000),
    });
    return response.ok ? response.json() : null;
  }

  async function requireUser() {
    const user = await currentUser();
    if (!user?.id) {
      const error = new Error('请先使用校内邮箱登录'); error.statusCode = 401; throw error;
    }
    return user;
  }

  async function requireModerator(userId) {
    const rows = await request(`${TABLES.moderators}?select=user_id&user_id=eq.${queryValue(userId)}&limit=1`);
    if (!rows?.length) {
      const error = new Error('当前账号没有审核权限'); error.statusCode = 403; throw error;
    }
  }

  try {
    const { action, payload = {} } = req.body || {};
    let data;

    switch (action) {
      case 'listPosts': data = await request(`${TABLES.posts}?select=*&order=created_at.desc`); break;
      case 'getPost': data = (await request(`${TABLES.posts}?select=*&id=eq.${queryValue(payload.id)}&limit=1`))?.[0] || null; break;
      case 'createPost': data = (await request(TABLES.posts, { method: 'POST', body: JSON.stringify(payload) }))?.[0] || null; break;
      case 'likePost': data = await request('rpc/increment_likes', { method: 'POST', body: JSON.stringify({ post_id: payload.id }) }); break;
      case 'listComments': data = await request(`${TABLES.comments}?select=*&post_id=eq.${queryValue(payload.postId)}&parent_id=is.null&order=created_at.desc`); break;
      case 'listReplies': data = await request(`${TABLES.comments}?select=*&parent_id=eq.${queryValue(payload.commentId)}&order=created_at.asc`); break;
      case 'createComment':
        data = (await request(TABLES.comments, { method: 'POST', body: JSON.stringify(payload.comment) }))?.[0] || null;
        await request('rpc/increment_comments_count', { method: 'POST', body: JSON.stringify({ post_id: payload.comment.post_id }) });
        break;
      case 'listDemands': {
        await requireUser();
        const rows = await request(`${TABLES.demands}?select=*,campus_profiles(nickname,avatar)&status=eq.open&expires_at=gt.${queryValue(new Date().toISOString())}&order=created_at.desc`);
        data = (rows || []).map(mapDemand); break;
      }
      case 'createDemand': {
        const user = await requireUser();
        const tags = Array.isArray(payload.tags) ? payload.tags : [];
        const item = {
          owner_id: user.id, category: payload.category || 'other', title: String(payload.title || '').slice(0, 60),
          description: String(payload.description || payload.title || '').slice(0, 1000),
          skills: tags.filter((tag) => !tag.startsWith('缺：') && !tag.startsWith('截止：') && !tag.startsWith('时间：')),
          missing_roles: tags.filter((tag) => tag.startsWith('缺：')).map((tag) => tag.replace('缺：', '')),
          available_time: String(payload.availableTime || '').slice(0, 100),
          meeting_place: String(payload.meetingPlace || '').slice(0, 100),
          expires_at: payload.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        const row = (await request(TABLES.demands, { method: 'POST', body: JSON.stringify(item) }))?.[0] || null;
        data = row ? mapDemand({ ...row, campus_profiles: { nickname: user.user_metadata?.nickname || user.email?.split('@')[0] } }) : null;
        break;
      }
      case 'listMyDemands': {
        const user = await requireUser();
        const rows = await request(`${TABLES.demands}?select=*,campus_profiles(nickname,avatar)&owner_id=eq.${queryValue(user.id)}&order=created_at.desc`);
        data = (rows || []).map(mapDemand); break;
      }
      case 'updateDemandStatus':
        await requireUser();
        data = (await request(`${TABLES.demands}?id=eq.${queryValue(payload.id)}`, { method: 'PATCH',
          body: JSON.stringify({ status: payload.status, updated_at: new Date().toISOString() }),
        }))?.[0] || null; break;
      case 'createInvite': {
        const user = await requireUser();
        if (!payload.to_user_id) throw new Error('该需求缺少真实接收账号，无法发送邀请');
        data = (await request(TABLES.invites, { method: 'POST', body: JSON.stringify({
          demand_id: payload.demand_id, from_user_id: user.id, to_user_id: payload.to_user_id,
          message: String(payload.content || '').slice(0, 500),
        }) }))?.[0] || null; break;
      }
      case 'listInvites': {
        await requireUser();
        const rows = await request(`${TABLES.invites}?select=*,from_profile:campus_profiles!campus_invites_from_user_id_fkey(nickname,avatar),to_profile:campus_profiles!campus_invites_to_user_id_fkey(nickname,avatar)&order=created_at.desc`);
        data = (rows || []).map((row) => ({ ...row, content: row.message,
          from_nickname: asProfile(row.from_profile).nickname || '校内用户',
          to_user: asProfile(row.to_profile).nickname || '校内用户',
        })); break;
      }
      case 'updateInviteStatus': {
        const user = await requireUser();
        const invite = (await request(`${TABLES.invites}?select=*&id=eq.${queryValue(payload.id)}&limit=1`))?.[0];
        if (!invite) throw new Error('邀请不存在或无权访问');
        if (['accepted', 'rejected'].includes(payload.status) && invite.to_user_id !== user.id) {
          const error = new Error('只有接收者可以接受或拒绝邀请'); error.statusCode = 403; throw error;
        }
        if (payload.status === 'cancelled' && invite.from_user_id !== user.id) {
          const error = new Error('只有发送者可以撤回邀请'); error.statusCode = 403; throw error;
        }
        data = (await request(`${TABLES.invites}?id=eq.${queryValue(payload.id)}`, { method: 'PATCH',
          body: JSON.stringify({ status: payload.status, updated_at: new Date().toISOString() }),
        }))?.[0] || null; break;
      }
      case 'listMessages':
        await requireUser();
        data = await request(`${TABLES.messages}?select=*&invite_id=eq.${queryValue(payload.inviteId)}&order=created_at.asc`);
        break;
      case 'createMessage': {
        const user = await requireUser();
        const content = String(payload.content || '').trim().slice(0, 1000);
        if (!content) throw new Error('消息内容不能为空');
        data = (await request(TABLES.messages, { method: 'POST', body: JSON.stringify({
          invite_id: payload.inviteId, sender_id: user.id, content,
        }) }))?.[0] || null;
        break;
      }
      case 'createReport': {
        const user = await requireUser();
        data = (await request(TABLES.reports, { method: 'POST', body: JSON.stringify({
          reporter_id: user.id, target_type: payload.targetType, target_id: payload.targetId,
          reason: String(payload.reason || '').slice(0, 500),
        }) }))?.[0] || null; break;
      }
      case 'listModeration': {
        const user = await requireUser(); await requireModerator(user.id);
        const [demands, reports] = await Promise.all([
          request(`${TABLES.demands}?select=*&moderation_status=eq.pending&order=created_at.asc`),
          request(`${TABLES.reports}?select=*&status=in.(pending,reviewing)&order=created_at.asc`),
        ]);
        data = { demands: demands || [], reports: reports || [] }; break;
      }
      case 'moderateItem': {
        const user = await requireUser(); await requireModerator(user.id);
        if (payload.targetType === 'demand') {
          data = (await request(`${TABLES.demands}?id=eq.${queryValue(payload.id)}`, { method: 'PATCH',
            body: JSON.stringify({ moderation_status: payload.status, updated_at: new Date().toISOString() }),
          }))?.[0] || null;
        } else if (payload.targetType === 'report') {
          data = (await request(`${TABLES.reports}?id=eq.${queryValue(payload.id)}`, { method: 'PATCH',
            body: JSON.stringify({ status: payload.status, resolved_at: payload.status === 'resolved' ? new Date().toISOString() : null }),
          }))?.[0] || null;
        } else throw new Error('不支持的审核对象');
        break;
      }
      case 'postsByIds': {
        const ids = Array.isArray(payload.ids) ? payload.ids.slice(0, 100) : [];
        data = ids.length ? await request(`${TABLES.posts}?select=*&id=in.(${ids.map(queryValue).join(',')})&order=created_at.desc`) : [];
        break;
      }
      default: return res.status(400).json({ error: 'Unknown data action' });
    }
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(error.statusCode || 502).json({ error: error.message || 'Data service unavailable' });
  }
}
