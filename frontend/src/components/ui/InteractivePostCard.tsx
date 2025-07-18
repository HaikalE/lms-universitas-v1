import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Heart, 
  Eye,
  Pin,
  Check,
  Award,
  User,
  Users,
  Calendar,
  BookOpen,
  MoreHorizontal,
  Share2,
  Flag,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from './Card';
import QuickReactionBar from './QuickReactionBar';
import { ForumPost, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface InteractivePostCardProps {
  post: ForumPost;
  onQuickReact: (postId: string, reactionType: string) => void;
  onBookmark: (postId: string) => void;
  onShare?: (postId: string) => void;
  onClick?: (e: React.MouseEvent) => void;
  showReactionBar?: boolean;
  className?: string;
}

const InteractivePostCard: React.FC<InteractivePostCardProps> = ({
  post,
  onQuickReact,
  onBookmark,
  onShare,
  onClick,
  showReactionBar = true,
  className = ''
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const isOwner = user?.id === post.authorId;
  const isLecturer = user?.role === UserRole.LECTURER;
  const isAdmin = user?.role === UserRole.ADMIN;

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const intervals = {
      tahun: 31536000,
      bulan: 2592000,
      minggu: 604800,
      hari: 86400,
      jam: 3600,
      menit: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit} yang lalu`;
      }
    }
    return 'Baru saja';
  };

  const getPostTypeStyles = (type?: string) => {
    switch (type) {
      case 'question':
        return 'bg-blue-50 border-l-4 border-l-blue-400';
      case 'discussion':
        return 'bg-green-50 border-l-4 border-l-green-400';
      case 'announcement':
        return 'bg-purple-50 border-l-4 border-l-purple-400';
      default:
        return 'bg-white border-l-4 border-l-gray-200';
    }
  };

  const getPostTypeIcon = (type?: string) => {
    switch (type) {
      case 'question':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'discussion':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'announcement':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/forums/${post.id}`);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    } else {
      // Default share functionality
      const shareUrl = `${window.location.origin}/forums/${post.id}`;
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: shareUrl,
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        // You could show a toast here
      }
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <Card 
      className={`
        group hover:shadow-xl transition-all duration-300 cursor-pointer
        transform hover:-translate-y-1 hover:scale-[1.01]
        ${getPostTypeStyles(post.type)}
        ${className}
      `}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Post type icon */}
              <div className="p-2 rounded-lg bg-white shadow-sm">
                {getPostTypeIcon(post.type)}
              </div>
              
              {/* Author info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {post.author?.fullName || 'Unknown User'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{post.author?.role === 'lecturer' ? 'Dosen' : 'Mahasiswa'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    Bagikan
                  </button>
                  {!isOwner && (
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-red-600">
                      <Flag className="w-4 h-4" />
                      Laporkan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Post badges */}
          <div className="flex items-center gap-2 mb-3">
            {post.isPinned && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            {post.isAnswered && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Terjawab
              </span>
            )}
            {post.isAnswer && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                Jawaban Terbaik
              </span>
            )}
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {post.course?.name || 'Unknown Course'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {stripHtml(post.content)}
          </p>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{post.children?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{post.likesCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Reaction Bar */}
        {showReactionBar && (
          <div className="mx-4 mb-4">
            <QuickReactionBar
              postId={post.id}
              reactions={{
                thumbsUp: post.quickReactions?.thumbsUp || 0,
                heart: post.quickReactions?.heart || 0,
                thinking: post.quickReactions?.thinking || 0,
                lightbulb: post.quickReactions?.lightbulb || 0
              }}
              userReactions={post.userReactions || []}
              onReact={onQuickReact}
              onBookmark={onBookmark}
              bookmarked={post.bookmarked}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractivePostCard;