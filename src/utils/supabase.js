import { demoDemands, demoPosts } from '../mock/demoData';

const KEYS = {
  profile: 'paidazi_guest_profile',
  bookmarks: 'paidazi_guest_bookmarks',
  posts: 'paidazi_local_posts',
  demands: 'paidazi_local_demands',
  comments: 'paidazi_local_comments',
  invites: 'paidazi_local_invites',
};

async function callData(action, payload = {}) {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    signal: AbortSignal.timeout(6000),
  });
  const result = await response.json();
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
  return {
    id: user?.id,
    email,
    phone: user?.phone || '',
    nickname: emailName ? `π星人${emailName}` : phoneTail ? `π星人${phoneTail}` : 'π星人',
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    tags: {},
    personality_answers: {},
  };
}

export async function getCurrentUser() { return null; }
export async function ensureProfile(user) { return user ? makeDefaultProfile(user) : null; }
export async function getCurrentProfile() { return getGuestProfile(); }

export async function updateCurrentProfile(updates) {
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
  try { return await callData('createDemand', item); }
  catch {
    const localItem = { ...item, is_local: true };
    writeLocal(KEYS.demands, [localItem, ...readLocal(KEYS.demands)]);
    return localItem;
  }
}

export async function createInvite(invite) {
  const profile = getGuestProfile();
  const item = {
    id: createId('invite'), to_user: invite.toUser, demand_id: invite.demandId, status: 'pending',
    content: `${profile.nickname}：${invite.content || '邀请你一起学习'}`, created_at: new Date().toISOString(),
  };
  try { return await callData('createInvite', item); }
  catch {
    const localItem = { ...item, is_local: true };
    writeLocal(KEYS.invites, [localItem, ...readLocal(KEYS.invites)]);
    return localItem;
  }
}

export async function fetchInvites() {
  const local = readLocal(KEYS.invites);
  try { return [...local, ...(await callData('listInvites') || [])]; }
  catch { return local; }
}

export async function fetchMyPosts() {
  return { posts: readLocal(KEYS.posts).map(normalizePost), demands: readLocal(KEYS.demands).map(normalizeDemand) };
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
