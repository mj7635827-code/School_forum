import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChatBubbleLeftIcon, 
  UserIcon, 
  EyeIcon, 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ReactionButton from '../components/Forum/ReactionButton';
import BookmarkButton from '../components/Forum/BookmarkButton';
import PrefixBadge from '../components/Forum/PrefixBadge';
import HiddenContent from '../components/Forum/HiddenContent';
import UserProfileCard from '../components/Forum/UserProfileCard';
import { forumAPI } from '../services/api';
import { removeKeycapEmojis } from '../utils/removeKeycapEmojis';

const ThreadDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostData, setEditPostData] = useState({ title: '', content: '' });
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [showUserProfile, setShowUserProfile] = useState(null);
  const repliesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchThread();
  }, [postId]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const [postResponse, repliesResponse] = await Promise.all([
        forumAPI.getPost(postId),
        forumAPI.getReplies(postId)
      ]);
      
      setPost(postResponse.data.post);
      setReplies(repliesResponse.data.replies || []);
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await forumAPI.createReply(postId, {
        content: replyContent,
        parentReplyId: replyingTo?.id || null
      });
      
      setReplyContent('');
      setReplyingTo(null);
      await fetchThread();
      
      // Scroll to bottom after posting
      setTimeout(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    try {
      await forumAPI.updatePost(postId, editPostData);
      setEditingPost(false);
      await fetchThread();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;
    
    try {
      await forumAPI.deletePost(postId);
      navigate(-1);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleEditReply = async (replyId) => {
    try {
      await forumAPI.updateReply(replyId, { content: editReplyContent });
      setEditingReply(null);
      setEditReplyContent('');
      await fetchThread();
    } catch (error) {
      console.error('Error updating reply:', error);
      alert('Failed to update reply');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      await forumAPI.deleteReply(replyId);
      await fetchThread();
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Failed to delete reply');
    }
  };

  const canEditDelete = (authorId) => {
    return currentUser.id === authorId || 
           currentUser.role === 'admin' || 
           currentUser.role === 'moderator';
  };

  const startEditPost = () => {
    setEditPostData({ title: post.title, content: post.content });
    setEditingPost(true);
  };

  const startEditReply = (reply) => {
    setEditingReply(reply.id);
    setEditReplyContent(reply.content);
  };

  // Build nested reply structure
  const buildReplyTree = (replies, parentId = null, depth = 0) => {
    return replies
      .filter(reply => reply.parentReplyId === parentId)
      .map(reply => ({
        ...reply,
        depth,
        children: buildReplyTree(replies, reply.id, depth + 1)
      }));
  };

  const ReplyItem = ({ reply, depth = 0 }) => {
    const maxDepth = 5;
    const isNested = depth > 0;
    const canNestMore = depth < maxDepth;

    return (
      <div className={`${isNested ? 'ml-8 mt-4' : 'mt-4'}`}>
        <div className={`bg-white rounded-lg p-4 shadow-sm ${isNested ? 'border-l-4 border-emerald-200 bg-emerald-50/30' : ''}`}>
          {/* Reply Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="h-4 w-4" />
              <button
                onClick={() => {
                  console.log('Clicked on user:', reply.authorId, reply.authorFirstName, reply.authorLastName);
                  setShowUserProfile(reply.authorId);
                }}
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
              >
                {reply.authorFirstName} {reply.authorLastName}
              </button>
              {reply.authorRole === 'admin' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Admin</span>
              )}
              {reply.authorRole === 'moderator' && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Mod</span>
              )}
              <span className="text-gray-400">•</span>
              <span>{new Date(reply.createdAt).toLocaleString()}</span>
            </div>
            
            {canEditDelete(reply.authorId) && (
              <div className="flex gap-2">
                <button
                  onClick={() => startEditReply(reply)}
                  className="text-gray-500 hover:text-emerald-600 transition"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteReply(reply.id)}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Reply Content */}
          {editingReply === reply.id ? (
            <form onSubmit={(e) => { e.preventDefault(); handleEditReply(reply.id); }} className="mb-3">
              <textarea
                value={editReplyContent}
                onChange={(e) => setEditReplyContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows="3"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingReply(null); setEditReplyContent(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {reply.parentReplyId && (
                <div className="mb-2 p-2 bg-gray-100 rounded text-sm text-gray-600 italic">
                  Replying to: {replies.find(r => r.id === reply.parentReplyId)?.authorFirstName || 'Unknown'}
                </div>
              )}
              <p className="text-gray-700 whitespace-pre-wrap mb-3">
                {removeKeycapEmojis(reply.content)}
              </p>
            </>
          )}

          {/* Reply Actions */}
          <div className="flex items-center gap-3">
            <ReactionButton
              replyId={reply.id}
              reactions={{
                likeCount: reply.likeCount,
                loveCount: reply.loveCount,
                hahaCount: reply.hahaCount,
                wowCount: reply.wowCount,
                sadCount: reply.sadCount,
                angryCount: reply.angryCount,
              }}
              userReaction={reply.userReaction}
              onReactionChange={fetchThread}
            />
            {canNestMore && (
              <button
                onClick={() => setReplyingTo(reply)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <ChatBubbleLeftIcon className="h-4 w-4" />
                Reply
              </button>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {reply.children && reply.children.length > 0 && (
          <div className="mt-2">
            {reply.children.map(childReply => (
              <ReplyItem key={childReply.id} reply={childReply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Thread not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 hover:text-emerald-700">
          Go Back
        </button>
      </div>
    );
  }

  const replyTree = buildReplyTree(replies);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Forum
      </button>

      {/* Thread Post */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {post.isPinned && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                  Pinned
                </span>
              )}
              {post.isLocked && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  Locked
                </span>
              )}
              <PrefixBadge prefix={post.prefix} />
            </div>
            
            {editingPost ? (
              <form onSubmit={handleEditPost} className="space-y-4">
                <input
                  type="text"
                  value={editPostData.title}
                  onChange={(e) => setEditPostData({ ...editPostData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xl font-semibold"
                />
                <textarea
                  value={editPostData.content}
                  onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows="6"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPost(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                {post.hasHiddenContent ? (
                  <HiddenContent 
                    content={post.content} 
                    postId={post.id}
                    hasReacted={!!post.userReaction}
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {removeKeycapEmojis(post.content)}
                  </p>
                )}
              </>
            )}
          </div>
          
          {!editingPost && canEditDelete(post.authorId) && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={startEditPost}
                className="text-gray-500 hover:text-emerald-600 transition"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDeletePost}
                className="text-gray-500 hover:text-red-600 transition"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Post Meta */}
        {!editingPost && (
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              <button
                onClick={() => setShowUserProfile(post.authorId)}
                className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
              >
                {post.authorFirstName} {post.authorLastName}
              </button>
              {post.authorRole === 'admin' && (
                <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Admin</span>
              )}
              {post.authorRole === 'moderator' && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Mod</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>{post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}</span>
            </div>
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>{post.viewCount} views</span>
            </div>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Post Reactions */}
        {!editingPost && (
          <div className="flex items-center gap-3">
            <ReactionButton
              postId={post.id}
              reactions={{
                likeCount: post.likeCount,
                loveCount: post.loveCount,
                hahaCount: post.hahaCount,
                wowCount: post.wowCount,
                sadCount: post.sadCount,
                angryCount: post.angryCount,
              }}
              userReaction={post.userReaction}
              onReactionChange={fetchThread}
            />
            <BookmarkButton
              postId={post.id}
              isBookmarked={post.isBookmarked > 0}
              onBookmarkChange={fetchThread}
            />
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Replies ({replies.length})
        </h2>

        {/* Replies List */}
        {replyTree.length > 0 ? (
          <div className="space-y-4 mb-6">
            {replyTree.map(reply => (
              <ReplyItem key={reply.id} reply={reply} depth={0} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8 mb-6">No replies yet. Be the first to reply!</p>
        )}

        {/* Reply Form - Moved to bottom */}
        {!post.isLocked && (
          <form onSubmit={handleSubmitReply} className="border-t pt-6">
            {replyingTo && (
              <div className="mb-3 p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-emerald-700">
                  Replying to <strong>{replyingTo.authorFirstName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.authorFirstName}...` : "Write your reply..."}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows="3"
              />
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                Post
              </button>
            </div>
          </form>
        )}

        <div ref={repliesEndRef} />
      </div>

      {/* User Profile Card Modal */}
      {showUserProfile && (
        <UserProfileCard
          userId={showUserProfile}
          onClose={() => setShowUserProfile(null)}
        />
      )}
    </div>
  );
};

export default ThreadDetail;
