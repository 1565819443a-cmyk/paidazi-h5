import { demoDemands, demoPosts } from '../mock/demoData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEYS = {
  profile: 'paidazi_guest_profile',
  bookmarks: 'paidazi_guest_bookmarks',
  posts: 'paidazi_local_posts',
  demands: 'paidazi_local_demands',
  comments: 'paidazi_local_comments',
  invites: 'paidazi_local_invites',
  reports: 'paidazi_local_reports',
};

async function callData(action, payload = {}) {
  let accessToken = '';
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token || '';
  }
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
    // The public Supabase route can be slow or blocked on some campus networks.
    // Fail fast so the UI can switch to the local/demo fallback without leaving
    // users staring at a loading state during a presentation or pilot.
    signal: AbortSignal.timeout(2500),
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(result.error || '数据服务暂时不可用');
  return result.data;
}

function readLocal(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocal(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, 100)));
  } catch {
    // Local persistence is optional; the caller still receives the current item.
  }
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function createGuestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return createId('guest');
}

export function getGuestProfile() {
  try {
    const saved = localStorage.getItem(KEYS.profile);
    if (saved) return JSON.parse(saved);
  } catch {
    // A temporary guest profile is created below when storage is unavailable.
  }

  const guestId = createGuestId();
  const profile = {
    guest_id: guestId,
    nickname: `π朋友${guestId.slice(-4)}`,
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    tags: {},
    personality_answers: {},
  };

  try {
    localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  } catch {
    // The in-memory profile remains usable for this page load.
  }
  return profile;
}

export function resetGuestProfile() {
  try {
    localStorage.removeItem(KEYS.profile);
    localStorage.removeItem(KEYS.bookmarks);
  } catch {
    // Continue with a fresh in-memory identity.
  }
  return getGuestProfile();
}

export function makeDefaultProfile(user) {
  const email = user?.email || '';
  const emailName = email.split('@')[0]?.slice(0, 12);
  const phoneTail = user?.phone ? user.phone.slice(-4) : '';
  const metadataName = user?.user_metadata?.nickname?.trim();
  return {
    id: user?.id,
    email,
    phone: user?.phone || '',
    nickname: metadataName || (emailName ? `π星人${emailName}` : phoneTail ? `π星人${phoneTail}` : 'π星人'),
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    tags: {},
    personality_answers: {},
  };
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function ensureProfile(user) {
  if (!user || !isSupabaseConfigured) return user ? makeDefaultProfile(user) : null;
  const { data, error } = await supabase
    .from('campus_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (!error && data) return { ...makeDefaultProfile(user), ...data, email: user.email || '' };

  const fallback = makeDefaultProfile(user);
  const { data: created, error: createError } = await supabase
    .from('campus_profiles')
    .upsert({
      id: user.id,
      nickname: fallback.nickname,
      avatar: fallback.avatar,
      campus_verified: Boolean(user.is_anonymous) || /@((stu|mail)\.)?xidian\.edu\.cn$/i.test(user.email || ''),
    })
    .select('*')
    .single();
  if (createError) return fallback;
  return { ...fallback, ...created };
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  return user ? ensureProfile(user) : getGuestProfile();
}

export async function updateCurrentProfile(updates, activeUser = null) {
  if (activeUser && isSupabaseConfigured) {
    const allowed = {
      nickname: updates.nickname,
      avatar: updates.avatar,
      college: updates.college,
      skills: updates.skills,
      interests: updates.interests,
      available_time: updates.available_time,
      updated_at: new Date().toISOString(),
    };
    Object.keys(allowed).forEach((key) => allowed[key] === undefined && delete allowed[key]);
    const { data, error } = await supabase
      .from('campus_profiles')
      .update(allowed)
      .eq('id', activeUser.id)
      .select('*')
      .single();
    if (error) throw error;
    return { ...makeDefaultProfile(activeUser), ...data };
  }
  const nextProfile = { ...getGuestProfile(), ...updates };
  try {
    localStorage.setItem(KEYS.profile, JSON.stringify(nextProfile));
  } catch {
    // The updated profile remains available to the caller.
  }
  return nextProfile;
}

export async function fetchPosts() {
  const localPosts = readLocal(KEYS.posts).map(normalizePost);
  try {
    const remotePosts = (await callData('listPosts') || []).map(normalizePost);
    if (remotePosts.length || localPosts.length) return [...localPosts, ...remotePosts];
    return demoPosts.map((item) => normalizePost({ ...item, demo_reason: 'empty' }));
  } catch (error) {
    console.warn('实时社区暂不可用，已切换到本机内容。', error);
    if (localPosts.length) return localPosts;
    return demoPosts.map((item) => normalizePost({ ...item, demo_reason: 'offline' }));
  }
}

export async function fetchPost(postId) {
  const local = readLocal(KEYS.posts).find((item) => item.id === postId);
  if (local) return normalizePost(local);
  const data = await callData('getPost', { id: postId });
  return data ? normalizePost(data) : data;
}

export async function createPost(post) {
  const profile = getGuestProfile();
  const item = {
    id: createId('post'),
    category: post.category,
    category_name: post.categoryName,
    content: [post.title, post.content, post.contact ? `联系方式：${post.contact}` : ''].filter(Boolean).join('\n'),
    nickname: profile.nickname,
    avatar: profile.avatar,
    likes: 0,
    comments_count: 0,
    url: post.url || null,
    link_text: post.linkText || null,
    created_at: new Date().toISOString(),
  };
  try {
    return await callData('createPost', item);
  } catch {
    const localItem = { ...item, is_local: true };
    writeLocal(KEYS.posts, [localItem, ...readLocal(KEYS.posts)]);
    return localItem;
  }
}

export async function likePost(postId) {
  const posts = readLocal(KEYS.posts);
  const index = posts.findIndex((item) => item.id === postId);
  if (index >= 0) {
    posts[index] = { ...posts[index], likes: (posts[index].likes || 0) + 1 };
    writeLocal(KEYS.posts, posts);
    return posts[index].likes;
  }
  return callData('likePost', { id: postId });
}

export async function fetchComments(postId) {
  const local = readLocal(KEYS.comments).filter((item) => item.post_id === postId && !item.parent_id);
  if (readLocal(KEYS.posts).some((item) => item.id === postId)) return local;
  try { return [...local, ...(await callData('listComments', { postId }) || [])]; }
  catch { return local; }
}

export async function fetchReplies(commentId) {
  const local = readLocal(KEYS.comments).filter((item) => item.parent_id === commentId);
  try { return [...local, ...(await callData('listReplies', { commentId }) || [])]; }
  catch { return local; }
}

export async function createComment(comment) {
  const profile = getGuestProfile();
  const item = {
    id: createId('comment'), post_id: comment.postId, parent_id: comment.parentId || null,
    nickname: profile.nickname, avatar: profile.avatar, content: comment.content,
    to_nickname: comment.toNickname || null, created_at: new Date().toISOString(),
  };
  try { return await callData('createComment', { comment: item }); }
  catch {
    const localItem = { ...item, is_local: true };
    writeLocal(KEYS.comments, [...readLocal(KEYS.comments), localItem]);
    return localItem;
  }
}

export async function fetchDemands() {
  const localDemands = readLocal(KEYS.demands).map(normalizeDemand);
  try {
    const remoteDemands = (await callData('listDemands') || []).map(normalizeDemand);
    if (remoteDemands.length || localDemands.length) return [...localDemands, ...remoteDemands];
    return demoDemands.map((item) => normalizeDemand({ ...item, demo_reason: 'empty' }));
  } catch (error) {
    console.warn('实时搭子数据暂不可用，已切换到本机内容。', error);
    if (localDemands.length) return localDemands;
    return demoDemands.map((item) => normalizeDemand({ ...item, demo_reason: 'offline' }));
  }
}

export async function createDemand(demand) {
  const profile = getGuestProfile();
  const item = {
    id: createId('demand'), category: demand.category, category_name: demand.categoryName,
    nickname: profile.nickname, avatar: profile.avatar,
    tags: [demand.title, ...(demand.tags || []), demand.contact ? `联系方式：${demand.contact}` : ''].filter(Boolean),
    personality_answers: demand.personalityAnswers || {}, created_at: new Date().toISOString(),
  };
  try {
    return await callData('createDemand', {
      category: demand.category,
      title: demand.title,
      description: demand.description || demand.tags?.join('；') || demand.title,
      tags: demand.tags || [],
      availableTime: demand.availableTime || '',
      meetingPlace: demand.meetingPlace || '',
      expiresAt: demand.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  }
  catch {
    const localItem = { ...item, is_local: true };
    writeLocal(KEYS.demands, [localItem, ...readLocal(KEYS.demands)]);
    return localItem;
  }
}

export async function createInvite(invite) {
  const activeUser = await getCurrentUser();
  if (!activeUser) throw new Error('请先登录试点账号再发送邀请');
  if (!invite.toUserId) throw new Error('该内容是演示或本机数据，不能发送真实邀请');
  const profile = getGuestProfile();
  const item = {
    id: createId('invite'), to_user: invite.toUser, to_user_id: invite.toUserId || null,
    demand_id: invite.demandId, status: 'pending',
    content: `${profile.nickname}：${invite.content || '邀请你一起学习'}`, created_at: new Date().toISOString(),
  };
  return callData('createInvite', item);
}

export async function fetchInvites() {
  const local = readLocal(KEYS.invites);
  try { return [...local, ...(await callData('listInvites') || [])]; }
  catch { return local; }
}

export async function updateInviteStatus(inviteId, status) {
  const allowed = ['accepted', 'rejected', 'cancelled', 'completed'];
  if (!allowed.includes(status)) throw new Error('无效的邀请状态');
  const invites = readLocal(KEYS.invites);
  const localIndex = invites.findIndex((item) => item.id === inviteId);
  if (localIndex >= 0) {
    invites[localIndex] = { ...invites[localIndex], status, updated_at: new Date().toISOString() };
    writeLocal(KEYS.invites, invites);
    return invites[localIndex];
  }
  return callData('updateInviteStatus', { id: inviteId, status });
}

export async function fetchMessages(inviteId) {
  if (!inviteId) return [];
  return callData('listMessages', { inviteId });
}

export async function createMessage(inviteId, content) {
  if (!inviteId || !content?.trim()) throw new Error('请输入消息内容');
  return callData('createMessage', { inviteId, content: content.trim() });
}

export async function createReport(report) {
  try {
    return await callData('createReport', report);
  } catch {
    const item = { ...report, id: createId('report'), status: 'pending', created_at: new Date().toISOString(), is_local: true };
    writeLocal(KEYS.reports, [item, ...readLocal(KEYS.reports)]);
    return item;
  }
}

export async function fetchModerationQueue() {
  return callData('listModeration');
}

export async function moderateItem(targetType, id, status) {
  return callData('moderateItem', { targetType, id, status });
}

export async function fetchMyPosts() {
  const localDemands = readLocal(KEYS.demands).map(normalizeDemand);
  let remoteDemands = [];
  try { remoteDemands = (await callData('listMyDemands') || []).map(normalizeDemand); }
  catch { /* Guest mode and offline mode only show local drafts. */ }
  return { posts: readLocal(KEYS.posts).map(normalizePost), demands: [...localDemands, ...remoteDemands] };
}

export async function updateDemandStatus(id, status) {
  if (!['open', 'matched', 'closed'].includes(status)) throw new Error('无效的需求状态');
  const demands = readLocal(KEYS.demands);
  const index = demands.findIndex((item) => item.id === id);
  if (index >= 0) {
    demands[index] = { ...demands[index], status };
    writeLocal(KEYS.demands, demands);
    return demands[index];
  }
  return callData('updateDemandStatus', { id, status });
}

export async function fetchStats() {
  const posts = readLocal(KEYS.posts);
  const demands = readLocal(KEYS.demands);
  const comments = readLocal(KEYS.comments);
  return {
    posts: posts.length,
    partners: demands.length,
    likes: posts.reduce((sum, item) => sum + (item.likes || 0), 0),
    comments: comments.length,
  };
}

export async function fetchBookmarkIds() { return readLocal(KEYS.bookmarks); }

export async function toggleBookmark(postId) {
  const ids = await fetchBookmarkIds();
  const nextIds = ids.includes(postId) ? ids.filter((id) => id !== postId) : [postId, ...ids];
  writeLocal(KEYS.bookmarks, nextIds);
  return nextIds.includes(postId);
}

export async function fetchBookmarkedPosts() {
  const ids = await fetchBookmarkIds();
  if (!ids.length) return [];
  return (await fetchPosts()).filter((item) => ids.includes(item.id) && !item.is_demo);
}

function normalizePost(post) {
  const lines = (post.content || '').split('\n').filter(Boolean);
  const contactLine = lines.find((line) => line.startsWith('联系方式：'));
  return {
    ...post,
    title: post.title || lines[0] || post.category_name || '未命名内容',
    contact: post.contact || contactLine?.replace('联系方式：', '') || '',
    user_id: post.user_id || null,
    guest_id: post.guest_id || null,
  };
}

function normalizeDemand(demand) {
  const tags = demand.tags || [];
  const contactTag = tags.find((tag) => tag.startsWith('联系方式：'));
  return {
    ...demand,
    title: demand.title || tags[0] || demand.category_name || '找搭子',
    contact: demand.contact || contactTag?.replace('联系方式：', '') || '',
    user_id: demand.user_id || null,
    guest_id: demand.guest_id || null,
  };
}
