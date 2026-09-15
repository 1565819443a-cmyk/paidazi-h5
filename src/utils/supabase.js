import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES = {
  profiles: 'real_profiles',
  posts: 'community_posts',
  comments: 'comments',
  demands: 'demands',
  invites: 'invites',
  bookmarks: 'real_bookmarks',
};

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
  if (!user) return null;

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const profile = makeDefaultProfile(user);
  const { data: created, error: createError } = await supabase
    .from(TABLES.profiles)
    .insert(profile)
    .select('*')
    .single();

  if (createError) throw createError;
  return created;
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
  const { data, error } = await supabase
    .from(TABLES.posts)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizePost);
}

export async function fetchPost(postId) {
  const { data, error } = await supabase
    .from(TABLES.posts)
    .select('*')
    .eq('id', postId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizePost(data) : data;
}

export async function createPost(post) {
  const profile = getGuestProfile();
  const content = [post.title, post.content, post.contact ? `联系方式：${post.contact}` : ''].filter(Boolean).join('\n');

  const { data, error } = await supabase
    .from(TABLES.posts)
    .insert({
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
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function likePost(postId) {
  const { data, error } = await supabase.rpc('increment_likes', { post_id: postId });
  if (error) throw error;
  return data;
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from(TABLES.comments)
    .select('*')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchReplies(commentId) {
  const { data, error } = await supabase
    .from(TABLES.comments)
    .select('*')
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createComment(comment) {
  const profile = getGuestProfile();

  const { data, error } = await supabase
    .from(TABLES.comments)
    .insert({
      post_id: comment.postId,
      parent_id: comment.parentId || null,
      nickname: profile.nickname,
      avatar: profile.avatar,
      content: comment.content,
      to_nickname: comment.toNickname || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  await supabase.rpc('increment_comments_count', { post_id: comment.postId });
  return data;
}

export async function fetchDemands() {
  const { data, error } = await supabase
    .from(TABLES.demands)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeDemand);
}

export async function createDemand(demand) {
  const profile = getGuestProfile();

  const { data, error } = await supabase
    .from(TABLES.demands)
    .insert({
      category: demand.category,
      category_name: demand.categoryName,
      nickname: profile.nickname,
      avatar: profile.avatar,
      tags: [demand.title, ...(demand.tags || []), demand.contact ? `联系方式：${demand.contact}` : ''].filter(Boolean),
      personality_answers: demand.personalityAnswers || {},
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createInvite(invite) {
  const profile = getGuestProfile();

  const { data, error } = await supabase
    .from(TABLES.invites)
    .insert({
      to_user: invite.toUser,
      demand_id: invite.demandId,
      status: 'pending',
      content: `${profile.nickname}：${invite.content || '邀请你一起学习'}`,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchInvites() {
  const { data, error } = await supabase
    .from(TABLES.invites)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMyPosts() {
  return { posts: [], demands: [] };
}

export async function fetchStats() {
  return { posts: 0, partners: 0, likes: 0, comments: 0 };
}

export async function fetchBookmarkIds() {
  const user = await getCurrentUser();
  if (!user) {
    try {
      return JSON.parse(localStorage.getItem(GUEST_BOOKMARKS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from(TABLES.bookmarks)
    .select('post_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((item) => item.post_id);
}

export async function toggleBookmark(postId) {
  const user = await getCurrentUser();
  if (!user) {
    const ids = await fetchBookmarkIds();
    const nextIds = ids.includes(postId) ? ids.filter((id) => id !== postId) : [postId, ...ids];
    try {
      localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(nextIds));
    } catch {}
    return nextIds.includes(postId);
  }

  const { data: existing, error: findError } = await supabase
    .from(TABLES.bookmarks)
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase.from(TABLES.bookmarks).delete().eq('id', existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from(TABLES.bookmarks).insert({ user_id: user.id, post_id: postId });
  if (error) throw error;
  return true;
}

export async function fetchBookmarkedPosts() {
  const user = await getCurrentUser();
  if (!user) {
    const ids = await fetchBookmarkIds();
    if (!ids.length) return [];
  const { data, error } = await supabase
    .from(TABLES.posts)
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizePost);
  }

  const { data, error } = await supabase
    .from(TABLES.bookmarks)
    .select('post:community_posts(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((item) => item.post).filter(Boolean);
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
