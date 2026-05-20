import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== 社区帖子 ====================

export async function fetchPosts() {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPost(post) {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      id: Date.now().toString(),
      category: post.category,
      category_name: post.categoryName,
      nickname: post.nickname || 'π星人',
      avatar: post.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      content: post.content,
      likes: 0,
      comments_count: 0,
      url: post.url || null,
      link_text: post.linkText || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function likePost(postId) {
  const { data, error } = await supabase.rpc('increment_likes', { post_id: postId });
  if (error) throw error;
  return data;
}

// ==================== 评论 ====================

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchReplies(commentId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createComment(comment) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: comment.postId,
      parent_id: comment.parentId || null,
      nickname: comment.nickname || 'π星人',
      avatar: comment.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      content: comment.content,
      to_nickname: comment.toNickname || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  // 更新帖子的评论数
  await supabase.rpc('increment_comments_count', { post_id: comment.postId });
  return data;
}

// ==================== 找搭子 ====================

export async function fetchDemands() {
  const { data, error } = await supabase
    .from('demands')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDemand(demand) {
  const { data, error } = await supabase
    .from('demands')
    .insert({
      category: demand.category,
      category_name: demand.categoryName,
      nickname: demand.nickname || '匿名同学',
      avatar: demand.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      tags: demand.tags || [],
      personality_answers: demand.personalityAnswers || {},
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== 邀请 ====================

export async function createInvite(invite) {
  const { data, error } = await supabase
    .from('invites')
    .insert({
      to_user: invite.toUser,
      demand_id: invite.demandId,
      status: 'pending',
      content: invite.content || '邀请你一起学习',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchInvites() {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ==================== 帖子统计 ====================

export async function fetchStats() {
  const [{ count: postCount }, { count: demandCount }, { count: inviteCount }] =
    await Promise.all([
      supabase.from('community_posts').select('*', { count: 'exact', head: true }),
      supabase.from('demands').select('*', { count: 'exact', head: true }),
      supabase.from('invites').select('*', { count: 'exact', head: true }),
    ]);
  return {
    posts: (postCount || 0) + (demandCount || 0),
    partners: inviteCount || 0,
    likes: 0,
    comments: 0,
  };
}
