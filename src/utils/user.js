import {
  fetchBookmarkedPosts,
  fetchBookmarkIds,
  getCurrentProfile,
  toggleBookmark,
  updateCurrentProfile,
} from './supabase';

const FALLBACK_PROFILE = {
  nickname: 'π星人',
  avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
};

export function getProfile() {
  return FALLBACK_PROFILE;
}

export async function loadProfile() {
  try {
    return await getCurrentProfile();
  } catch {
    return FALLBACK_PROFILE;
  }
}

export async function saveProfile(profile) {
  return updateCurrentProfile(profile);
}

export async function getBookmarkIds() {
  return fetchBookmarkIds();
}

export { fetchBookmarkedPosts, toggleBookmark };

export async function isBookmarked(postId) {
  const ids = await fetchBookmarkIds();
  return ids.includes(postId);
}

export function addMyPostId() {
  return null;
}

export function getMyPostIds() {
  return [];
}

export function addMyInviteId() {
  return null;
}

export function getMyInviteIds() {
  return [];
}
