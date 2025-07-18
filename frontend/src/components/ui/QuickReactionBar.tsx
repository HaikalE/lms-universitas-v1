import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  Heart, 
  MessageCircle, 
  Bookmark,
  Check,
  Users,
  Brain,
  Lightbulb,
  Coffee
} from 'lucide-react';

interface QuickReaction {
  emoji: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  userReacted: boolean;
}

interface QuickReactionBarProps {
  postId: string;
  reactions?: {
    thumbsUp: number;
    heart: number; 
    thinking: number;
    lightbulb: number;
  };
  userReactions?: string[];
  onReact: (postId: string, reactionType: string) => void;
  onBookmark: (postId: string) => void;
  bookmarked?: boolean;
  className?: string;
}

const QuickReactionBar: React.FC<QuickReactionBarProps> = ({
  postId,
  reactions = { thumbsUp: 0, heart: 0, thinking: 0, lightbulb: 0 },
  userReactions = [],
  onReact,
  onBookmark,
  bookmarked = false,
  className = ''
}) => {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localUserReactions, setLocalUserReactions] = useState(userReactions);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);

  const reactionTypes: QuickReaction[] = [
    {
      emoji: '👍',
      icon: <ThumbsUp className="w-4 h-4" />,
      label: 'Membantu',
      count: localReactions.thumbsUp,
      userReacted: localUserReactions.includes('thumbsUp')
    },
    {
      emoji: '❤️',
      icon: <Heart className="w-4 h-4" />,
      label: 'Suka',
      count: localReactions.heart,
      userReacted: localUserReactions.includes('heart')
    },
    {
      emoji: '🤔',
      icon: <Brain className="w-4 h-4" />,
      label: 'Menarik',
      count: localReactions.thinking,
      userReacted: localUserReactions.includes('thinking')
    },
    {
      emoji: '💡',
      icon: <Lightbulb className="w-4 h-4" />,
      label: 'Ide Bagus',
      count: localReactions.lightbulb,
      userReacted: localUserReactions.includes('lightbulb')
    }
  ];

  const handleReaction = async (reactionType: string) => {
    try {
      // Optimistic update
      setLocalReactions(prev => {
        const isCurrentlyReacted = localUserReactions.includes(reactionType);
        const newCount = isCurrentlyReacted 
          ? Math.max(0, prev[reactionType] - 1)
          : prev[reactionType] + 1;
        
        return {
          ...prev,
          [reactionType]: newCount
        };
      });

      setLocalUserReactions(prev => {
        const isCurrentlyReacted = prev.includes(reactionType);
        return isCurrentlyReacted
          ? prev.filter(r => r !== reactionType)
          : [...prev, reactionType];
      });

      // Call parent handler
      await onReact(postId, reactionType);
    } catch (error) {
      // Revert optimistic update on error
      setLocalReactions(reactions);
      setLocalUserReactions(userReactions);
      console.error('Error updating reaction:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      // Optimistic update
      setIsBookmarked(!isBookmarked);
      await onBookmark(postId);
    } catch (error) {
      // Revert on error
      setIsBookmarked(isBookmarked);
      console.error('Error updating bookmark:', error);
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border ${className}`}>
      {/* Quick Reactions */}
      <div className="flex items-center gap-2">
        {reactionTypes.map((reaction) => (
          <button
            key={reaction.label}
            onClick={() => handleReaction(reaction.label.toLowerCase().replace(' ', ''))}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
              transition-all duration-200 hover:scale-105 active:scale-95
              ${reaction.userReacted 
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
            title={reaction.label}
          >
            <span className="text-sm">{reaction.emoji}</span>
            {reaction.count > 0 && (
              <span className="text-xs font-semibold">{reaction.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bookmark Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleBookmark}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all duration-200 hover:scale-105 active:scale-95
            ${isBookmarked
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }
          `}
          title={isBookmarked ? 'Hapus dari tersimpan' : 'Simpan post'}
        >
          {isBookmarked ? (
            <div className="relative">
              <Bookmark className="w-4 h-4 fill-current" />
              <Check className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 bg-yellow-700 text-yellow-100 rounded-full p-0.5" />
            </div>
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isBookmarked ? 'Tersimpan' : 'Simpan'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuickReactionBar;