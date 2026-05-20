const STORAGE_KEYS = {
  profile: 'user_profile',
  myPosts: 'my_post_ids',
  myInvites: 'my_invite_ids',
  bookmarks: 'bookmarked_post_ids',
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profile);
    return raw ? JSON.parse(raw) : { nickname: 'π星人', avatar: 'https://randomuser.me/api/portraits/lego/1.jpg' };
  } catch {
    return { nickname: 'π星人', avatar: 'https://randomuser.me/api/portraits/lego/1.jpg' };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function getMyPostIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.myPosts) || '[]');
  } catch {
    return [];
  }
}

export function addMyPostId(id) {
  const ids = getMyPostIds();
  ids.unshift(id);
  localStorage.setItem(STORAGE_KEYS.myPosts, JSON.stringify(ids.slice(0, 100)));
}

export function getMyInviteIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.myInvites) || '[]');
  } catch {
    return [];
  }
}

export function addMyInviteId(id) {
  const ids = getMyInviteIds();
  ids.unshift(id);
  localStorage.setItem(STORAGE_KEYS.myInvites, JSON.stringify(ids.slice(0, 100)));
}

export function getBookmarkIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookmarks) || '[]');
  } catch {
    return [];
  }
}

export function toggleBookmark(postId) {
  const ids = getBookmarkIds();
  const idx = ids.indexOf(postId);
  if (idx > -1) {
    ids.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(ids));
    return false;
  } else {
    ids.unshift(postId);
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(ids));
    return true;
  }
}

export function isBookmarked(postId) {
  return getBookmarkIds().includes(postId);
}
