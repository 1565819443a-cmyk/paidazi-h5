import { demoDemands, demoPosts } from '../mock/demoData';

async function callData(action, payload = {}) {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '数据服务暂时不可用');
  return result.data;
}

const GUEST_PROFILE_KEY = 'paidazi_guest_profile';
const GUEST_BOOKMARKS_KEY = 'paidazi_guest_bookmarks';

function createGuestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getGuestProfile() {
  try {
    const saved = localStorage.getItem(GUEST_PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}

  const guestId = createGuestId();
  const profile = {
    guest_id: guestId,
    nickname: `π朋友${guestId.slice(-4)}`,
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    tags: {},
    personality_answers: {},
  };

  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch {}

  return profile;
}

export function resetGuestProfile() {
  try {
    localStorage.removeItem(GUEST_PROFILE_KEY);
    localStorage.removeItem(GUEST_BOOKMARKS_KEY);
  } catch {}
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

export async function getCurrentUser() {
  return null;
}

export async function ensureProfile(user) {
  return user ? makeDefaultProfile(user) : null;
}

export async function getCurrentProfile() {
  return getGuestProfile();
}

export async function updateCurrentProfile(updates) {
  const nextProfile = { ...getGuestProfile(), ...updates };
  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(nextProfile));
  } catch {}
  return nextProfile;
}

export async function fetchPosts() {
  try {
    const data = await callData('listPosts');
    if (!data?.length) return demoPosts.map((item) => normalizePost({ ...item, demo_reason: 'empty' }));
    return data.map(normalizePost);
  } catch (error) {
    console.warn('实时社区暂不可用，已切换到示例内容。', error);
    return demoPosts.map((item) => normalizePost({ ...item, demo_reason: 'offline' }));
  }
}

export async function fetchPost(postId) {
  const data = await callData('getPost', { id: postId });
  return data ? normalizePost(data) : data;
}

export async function createPost(post) {
  const profile = getGuestProfile();
  const content = [post.title, post.content, post.contact ? `联系方式：${post.contact}` : ''].filter(Boolean).join('\n');

  return callData('createPost', {
      id: `post_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      category: post.category,
      category_name: post.categoryName,
      content,
      nickname: profile.nickname,
      avatar: profile.avatar,
      likes: 0,
      comments_count: 0,
      url: post.url || null,
      link_text: post.linkText || null,
  });
}

export async function likePost(postId) {
  return callData('likePost', { id: postId });
}

export async function fetchComments(postId) {
  const data = await callData('listComments', { postId });
  return data || [];
}

export async function fetchReplies(commentId) {
  const data = await callData('listReplies', { commentId });
  return data || [];
}

export async function createComment(comment) {
  const profile = getGuestProfile();

  return callData('createComment', { comment: {
      post_id: comment.postId,
      parent_id: comment.parentId || null,
      nickname: profile.nickname,
      avatar: profile.avatar,
      content: comment.content,
      to_nickname: comment.toNickname || null,
  } });
}

export async function fetchDemands() {
  try {
    const data = await callData('listDemands');
    if (!data?.length) return demoDemands.map((item) => normalizeDemand({ ...item, demo_reason: 'empty' }));
    return data.map(normalizeDemand);
  } catch (error) {
    console.warn('实时搭子数据暂不可用，已切换到示例内容。', error);
    return demoDemands.map((item) => normalizeDemand({ ...item, demo_reason: 'offline' }));
  }
}

export async function createDemand(demand) {
  const profile = getGuestProfile();

  return callData('createDemand', {
      category: demand.category,
      category_name: demand.categoryName,
      nickname: profile.nickname,
      avatar: profile.avatar,
      tags: [demand.title, ...(demand.tags || []), demand.contact ? `联系方式：${demand.contact}` : ''].filter(Boolean),
      personality_answers: demand.personalityAnswers || {},
  });
}

export async function createInvite(invite) {
  const profile = getGuestProfile();

  return callData('createInvite', {
      to_user: invite.toUser,
      demand_id: invite.demandId,
      status: 'pending',
      content: `${profile.nickname}：${invite.content || '邀请你一起学习'}`,
  });
}

export async function fetchInvites() {
  const data = await callData('listInvites');
  return data || [];
}

export async function fetchMyPosts() {
  return { posts: [], demands: [] };
}

export async function fetchStats() {
  return { posts: 0, partners: 0, likes: 0, comments: 0 };
}

export async function fetchBookmarkIds() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_BOOKMARKS_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function toggleBookmark(postId) {
  const ids = await fetchBookmarkIds();
  const nextIds = ids.includes(postId) ? ids.filter((id) => id !== postId) : [postId, ...ids];
  try {
    localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(nextIds));
  } catch {}
  return nextIds.includes(postId);
}

export async function fetchBookmarkedPosts() {
  const ids = await fetchBookmarkIds();
  if (!ids.length) return [];
  const data = await callData('postsByIds', { ids });
  return (data || []).map(normalizePost);
}

function normalizePost(post) {
  const lines = (post.content || '').split('\n').filter(Boolean);
  const title = post.title || lines[0] || post.category_name || '未命名内容';
  const contactLine = lines.find((line) => line.startsWith('联系方式：'));
  return {
    ...post,
    title,
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
