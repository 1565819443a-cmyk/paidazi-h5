-- π搭子 Supabase 数据库建表 SQL
-- 在 Supabase SQL Editor 中运行此文件

-- 1. 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  category_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  url TEXT,
  link_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 评论表
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  to_nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 找搭子表
CREATE TABLE IF NOT EXISTS demands (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  category_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  personality_answers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 邀请表
CREATE TABLE IF NOT EXISTS invites (
  id BIGSERIAL PRIMARY KEY,
  to_user TEXT NOT NULL,
  demand_id BIGINT REFERENCES demands(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  content TEXT DEFAULT '邀请你一起学习',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS 策略：允许匿名读写
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON demands FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON invites FOR SELECT USING (true);

-- 允许所有人写入
CREATE POLICY "Allow public insert" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON invites FOR INSERT WITH CHECK (true);

-- 允许所有人更新
CREATE POLICY "Allow public update" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON comments FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON demands FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON invites FOR UPDATE USING (true);

-- 存储过程：点赞 +1
CREATE OR REPLACE FUNCTION increment_likes(post_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE community_posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 存储过程：评论数 +1
CREATE OR REPLACE FUNCTION increment_comments_count(post_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_demands_created_at ON demands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON invites(created_at DESC);
