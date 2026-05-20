import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, fetchComments, fetchReplies, createComment } from '../utils/supabase';
import { useToast } from '../components/Toast';
import './Comment.css';

export default function Comment() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);

  const postId = searchParams.get('postId');

  useEffect(() => {
    if (!postId) {
      showToast('参数错误');
      setLoading(false);
      return;
    }
    loadPostAndComments();
  }, [postId]);

  async function loadPostAndComments() {
    setLoading(true);
    try {
      const { data: postData } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single();

      setPost(postData || {
        id: postId,
        nickname: '未知用户',
        avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        content: '帖子不存在或已删除',
        category: 'note',
        category_name: '帖子',
        created_at: new Date().toISOString(),
      });

      await loadCommentsData(postId);
    } catch (err) {
      console.error('加载失败:', err);
      showToast('加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadCommentsData(pid) {
    try {
      const topComments = await fetchComments(pid);
      const commentsWithReplies = await Promise.all(
        topComments.map(async (c) => {
          const replies = await fetchReplies(c.id);
          return { ...c, replies };
        })
      );
      setComments(commentsWithReplies);
    } catch (err) {
      console.error('加载评论失败:', err);
    }
  }

  function showReply(id, nickname) {
    setReplyTo({ id, nickname });
  }

  function cancelReply() {
    setReplyTo(null);
    setCommentText('');
  }

  async function submitComment() {
    const text = commentText.trim();
    if (!text) {
      showToast('请输入内容');
      return;
    }

    try {
      if (replyTo) {
        await createComment({
          postId: post.id,
          parentId: replyTo.id,
          content: text,
          nickname: 'π星人',
          avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
          toNickname: replyTo.nickname,
        });
        cancelReply();
      } else {
        await createComment({
          postId: post.id,
          content: text,
          nickname: 'π星人',
          avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        });
        setCommentText('');
      }
      await loadCommentsData(post.id);
      showToast('发送成功', 'success');
    } catch (err) {
      console.error('评论失败:', err);
      showToast('发送失败，请重试');
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return '未知';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min}分钟前`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }

  if (loading) {
    return (
      <div className="comment-container">
        <div className="empty">加载中...</div>
      </div>
    );
  }

  return (
    <div className="comment-container">
      <div className="post-info">
        <div className="post-header">
          <img className="post-avatar" src={post?.avatar} alt="" />
          <div className="post-user">
            <span className="post-nickname">{post?.nickname}</span>
            <span className="post-time">{formatTime(post?.created_at)}</span>
          </div>
          <div className={`post-cat ${post?.category}`}>{post?.category_name}</div>
        </div>
        <div className="post-content-text">{post?.content}</div>
      </div>

      <div className="comment-section">
        <div className="comment-title">💬 全部评论 ({comments.length})</div>

        {comments.length === 0 ? (
          <div className="empty">暂无评论，快来抢沙发～</div>
        ) : (
          comments.map((item) => (
            <div key={item.id} className="comment-item">
              <img className="comment-avatar" src={item.avatar} alt="" />
              <div className="comment-content">
                <div className="comment-hd">
                  <span className="comment-nickname">{item.nickname}</span>
                  <span className="comment-time">{formatTime(item.created_at)}</span>
                </div>
                <span className="comment-text">{item.content}</span>
                <div className="comment-actions">
                  <span className="reply-btn" onClick={() => showReply(item.id, item.nickname)}>回复</span>
                </div>

                {item.replies && item.replies.length > 0 && (
                  <div className="reply-list">
                    {item.replies.map((rep) => (
                      <div key={rep.id} className="reply-item">
                        <span className="reply-nickname">{rep.nickname}</span>
                        <span className="reply-text"> 回复 </span>
                        <span className="reply-nickname">{rep.to_nickname}</span>
                        <span className="reply-content">：{rep.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="comment-input-area">
        {replyTo && (
          <div className="reply-hint">
            回复 @{replyTo.nickname}
            <span className="cancel-reply" onClick={cancelReply}>✕</span>
          </div>
        )}
        <div className="input-wrapper">
          <input className="comment-input" placeholder={replyTo ? '写下你的回复...' : '写下你的评论...'} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button className="send-btn" onClick={submitComment} disabled={!commentText.trim()}>发送</button>
        </div>
      </div>
    </div>
  );
}
