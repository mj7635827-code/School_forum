import { useState } from 'react';
import { forumAPI } from '../../services/api';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
];

const ReactionButton = ({ postId, replyId, reactions, userReaction, onReactionChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);

  const handleReaction = async (reactionType) => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (userReaction === reactionType) {
        // Remove reaction if clicking the same one
        if (replyId) {
          await forumAPI.removeReplyReaction(replyId);
        } else {
          await forumAPI.removePostReaction(postId);
        }
      } else {
        // Add or change reaction
        if (replyId) {
          await forumAPI.reactToReply(replyId, reactionType);
        } else {
          await forumAPI.reactToPost(postId, reactionType);
        }
      }
      
      if (onReactionChange) {
        onReactionChange();
      }
      setShowPicker(false);
    } catch (error) {
      console.error('Error reacting:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactions || {}).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getTopReactions = () => {
    if (!reactions) return [];
    
    return REACTIONS
      .map(r => ({ ...r, count: reactions[`${r.type}Count`] || 0 }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const topReactions = getTopReactions();
  const totalReactions = getTotalReactions();

  const handleShowUsers = async (reactionType, emoji) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = replyId 
        ? `http://localhost:5000/api/forum/reply/${replyId}/reactions/${reactionType}`
        : `http://localhost:5000/api/forum/post/${postId}/reactions/${reactionType}`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setModalUsers(data.users || []);
        setShowUsersModal({ type: reactionType, emoji });
      }
    } catch (error) {
      console.error('Error fetching reaction users:', error);
    }
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        {/* Main reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            userReaction
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={loading}
        >
          {userReaction ? (
            <>
              <span className="text-base emoji-ios">
                {REACTIONS.find(r => r.type === userReaction)?.emoji}
              </span>
              <span>{REACTIONS.find(r => r.type === userReaction)?.label}</span>
            </>
          ) : (
            <>
              <span className="text-base emoji-ios">👍</span>
              <span>React</span>
            </>
          )}
        </button>

        {/* Reaction counts - clickable */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-2">
            {topReactions.map(reaction => (
              <button
                key={reaction.type}
                onClick={() => handleShowUsers(reaction.type, reaction.emoji)}
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition"
              >
                <span className="text-lg emoji-ios">{reaction.emoji}</span>
                <span className="text-sm text-gray-700 font-normal">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUsersModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl emoji-ios">{showUsersModal.emoji}</span>
                <span>Reactions</span>
              </h3>
              <button
                onClick={() => setShowUsersModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {modalUsers.length > 0 ? (
                modalUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span className="text-sm text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No reactions yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reaction picker */}
      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1 z-20">
            {REACTIONS.map(reaction => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className={`p-2 rounded-lg hover:bg-gray-100 transition ${
                  userReaction === reaction.type ? 'bg-emerald-50 ring-2 ring-emerald-500' : ''
                }`}
                title={reaction.label}
                disabled={loading}
              >
                <span className="text-2xl emoji-ios">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReactionButton;
