import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Eye,
  MoreVertical,
  Send,
  Pin,
  Check,
  Edit2,
  Trash2,
  Flag,
  User,
  Calendar,
  Tag,
  BookOpen,
  ThumbsUp,
  Reply,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { useAuth } from '../../contexts/AuthContext';
import { forumService } from '../../services';
import { ForumPost } from '../../types';

const ForumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  // ✅ FIXED: Use ForumPost[] instead of ForumReply[] to match backend data structure
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [sortReplies, setSortReplies] = useState<'latest' | 'oldest' | 'popular'>('oldest');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const isOwner = user?.id === post?.authorId;
  const isLecturer = user?.role === 'lecturer';
  const isAdmin = user?.role === 'admin';
  const canModerate = isOwner || isLecturer || isAdmin;

  useEffect(() => {
    if (id) {
      fetchPostDetails();
    }
  }, [id]);

  // ✅ FIXED: Only refresh replies when sort changes (not on initial load)
  useEffect(() => {
    if (id && post && replies.length > 0 && sortReplies !== 'oldest') {
      // Only fetch separately if we're not using default sort and we have replies
      fetchReplies(id);
    }
  }, [sortReplies]); // Removed post dependency to avoid re-fetching

  // ✅ FIXED: Updated fetchPostDetails to handle replies from main response
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 FRONTEND: Fetching forum post details for ID:', id);
      
      // ✅ FIXED: Fetch post details which now includes replies
      const postResponse = await forumService.getForumPost(id!);
      console.log('✅ FRONTEND: Forum post fetched:', postResponse.data);
      
      const postData = postResponse.data;
      setPost(postData);
      
      // ✅ FIXED: Extract replies from post response instead of separate API call
      if (postData.replies && Array.isArray(postData.replies)) {
        console.log(`📝 FRONTEND: Found ${postData.replies.length} replies in post response`);
        setReplies(postData.replies);
      } else {
        console.log('📝 FRONTEND: No replies found in post response');
        setReplies([]);
      }
      
      // Mark as viewed (non-blocking)
      try {
        await forumService.markPostAsViewed(id!);
      } catch (viewError) {
        console.warn('⚠️ FRONTEND: Could not mark post as viewed:', viewError);
      }
      
    } catch (error) {
      console.error('❌ FRONTEND: Error fetching post details:', error);
      setReplies([]); // Ensure replies is always an array
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Simplified fetchReplies - now only used for refreshing after sort changes
  const fetchReplies = async (postId: string) => {
    try {
      console.log('🔄 FRONTEND: Refreshing replies with sort:', sortReplies);
      
      // Only fetch replies separately if we need to apply different sorting
      const repliesResponse = await forumService.getForumReplies(postId, { sort: sortReplies });
      console.log('✅ FRONTEND: Replies refreshed:', repliesResponse);
      
      // Handle response format
      let repliesData = [];
      if (repliesResponse && repliesResponse.data) {
        repliesData = repliesResponse.data;
      } else if (Array.isArray(repliesResponse)) {
        repliesData = repliesResponse;
      } else {
        console.warn('⚠️ FRONTEND: Unexpected replies response format:', repliesResponse);
        repliesData = [];
      }

      console.log(`📝 FRONTEND: Updated replies list with ${repliesData.length} items`);
      setReplies(Array.isArray(repliesData) ? repliesData : []);
      
    } catch (error) {
      console.error('❌ FRONTEND: Error refreshing replies:', error);
      // Don't clear replies on refresh error, keep existing data
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    
    try {
      console.log('❤️ FRONTEND: Liking post:', post.id);
      await forumService.toggleLike(post.id);
      
      // Update local state
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1
      });
      
      console.log('✅ FRONTEND: Post like toggled successfully');
    } catch (error) {
      console.error('❌ FRONTEND: Error liking post:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    try {
      console.log('❤️ FRONTEND: Liking reply:', replyId);
      // Note: This endpoint might not exist yet, handle gracefully
      await forumService.likeReply(replyId);
      
      setReplies(replies.map(reply => 
        reply.id === replyId 
          ? {
              ...reply,
              isLiked: !reply.isLiked,
              likesCount: reply.isLiked ? reply.likesCount - 1 : reply.likesCount + 1
            }
          : reply
      ));
      
      console.log('✅ FRONTEND: Reply like toggled successfully');
    } catch (error) {
      console.error('❌ FRONTEND: Error liking reply (endpoint may not exist):', error);
    }
  };

  // ✅ FIXED: After creating reply, add to local state AND update reply count
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !post) return;
    
    try {
      console.log('💬 FRONTEND: Creating reply for post:', post.id);
      
      // ✅ FIXED: Use createReply service which calls the correct endpoint
      const replyData = {
        content: replyContent.trim(),
        ...(replyingTo && { parentId: replyingTo })
      };
      
      console.log('🚀 FRONTEND: Submitting reply data:', replyData);
      
      // ✅ CORRECT: Use createReply instead of createForumPost
      const newReplyResponse = await forumService.createReply(post.id, replyData);
      const newReply = newReplyResponse.data || newReplyResponse;
      
      console.log('✅ FRONTEND: Reply created successfully:', newReply);
      
      // ✅ FIXED: Add to local replies state (ensure it's an array)
      setReplies(prevReplies => [...prevReplies, newReply]);
      setReplyContent('');
      setReplyingTo(null);
      
      // ✅ FIXED: Update reply count in post
      setPost(prevPost => ({
        ...prevPost!,
        repliesCount: (prevPost!.repliesCount || 0) + 1
      }));
      
      console.log('✅ FRONTEND: Reply added to UI successfully');
      
    } catch (error) {
      console.error('❌ FRONTEND: Error submitting reply:', error);
      alert('Gagal mengirim balasan. Silakan coba lagi.');
    }
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!editContent.trim()) return;
    
    try {
      console.log('✏️ FRONTEND: Updating reply:', replyId);
      
      await forumService.updateForumPost(replyId, { content: editContent });
      
      setReplies(replies.map(reply => 
        reply.id === replyId ? { ...reply, content: editContent } : reply
      ));
      setEditingReply(null);
      setEditContent('');
      
      console.log('✅ FRONTEND: Reply updated successfully');
    } catch (error) {
      console.error('❌ FRONTEND: Error updating reply:', error);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!window.confirm('Yakin ingin menghapus balasan ini?')) return;
    
    try {
      console.log('🗑️ FRONTEND: Deleting reply:', replyId);
      
      await forumService.deleteForumPost(replyId);
      
      setReplies(replies.filter(reply => reply.id !== replyId));
      
      if (post && post.repliesCount !== undefined) {
        setPost({
          ...post,
          repliesCount: post.repliesCount - 1
        });
      }
      
      console.log('✅ FRONTEND: Reply deleted successfully');
    } catch (error) {
      console.error('❌ FRONTEND: Error deleting reply:', error);
    }
  };

  const handleMarkAsAnswer = async (replyId: string) => {
    if (!post || !isOwner) return;
    
    try {
      console.log('✅ FRONTEND: Marking reply as answer:', replyId);
      // Note: This endpoint might not exist yet
      await forumService.markAsAnswer(post.id, replyId);
      
      setReplies(replies.map(reply => ({
        ...reply,
        isAnswer: reply.id === replyId
      })));
      setPost({ ...post, isAnswered: true });
      
      console.log('✅ FRONTEND: Reply marked as answer successfully');
    } catch (error) {
      console.error('❌ FRONTEND: Error marking as answer (endpoint may not exist):', error);
    }
  };

  const handlePinPost = async () => {
    if (!post || !canModerate) return;
    
    try {
      console.log('📌 FRONTEND: Toggling pin for post:', post.id);
      
      await forumService.togglePin(post.id);
      setPost({ ...post, isPinned: !post.isPinned });
      
      console.log('✅ FRONTEND: Post pin toggled successfully');
    } catch (error) {
      console.error('❌ FRONTEND: Error pinning post:', error);
    }
  };

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

  const toggleReplyExpansion = (replyId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(replyId)) {
      newExpanded.delete(replyId);
    } else {
      newExpanded.add(replyId);
    }
    setExpandedReplies(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Post tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/forums')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Forum
      </button>

      {/* Main Post */}
      <Card>
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{post.author?.fullName || 'Unknown User'}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{post.author?.role === 'lecturer' ? 'Dosen' : 'Mahasiswa'}</span>
                  <span>•</span>
                  <span>{getTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {canModerate && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(showActions === post.id ? null : post.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                
                {showActions === post.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={handlePinPost}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Pin className="w-4 h-4" />
                      {post.isPinned ? 'Unpin' : 'Pin'} Post
                    </button>
                    {isOwner && (
                      <>
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit Post
                        </button>
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600">
                          <Trash2 className="w-4 h-4" />
                          Hapus Post
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600">
                        <Flag className="w-4 h-4" />
                        Laporkan
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Title and Meta */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {post.isPinned && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
              {post.isAnswered && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Terjawab
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {post.course?.name || 'Unknown Course'}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>
          </div>

          {/* Post Content */}
          <div 
            className="prose max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLikePost}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                  post.isLiked 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likesCount || 0}</span>
              </button>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="w-5 h-5" />
                <span>{post.viewsCount || 0} views</span>
              </div>
              
              {/* ✅ FIXED: Update the replies count display to be consistent */}
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{post.repliesCount || replies.length} balasan</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setReplyingTo(null);
                const editorElement = document.querySelector('[data-testid="reply-editor"]');
                if (editorElement) {
                  editorElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Reply className="w-5 h-5" />
              Balas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Replies Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* ✅ FIXED: Update the Replies Section header */}
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Balasan ({post.repliesCount || replies.length})
            </CardTitle>
            
            <select
              value={sortReplies}
              onChange={(e) => setSortReplies(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="oldest">Terlama</option>
              <option value="latest">Terbaru</option>
              <option value="popular">Terpopuler</option>
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Reply Editor */}
          <div className="bg-gray-50 p-4 rounded-lg" data-testid="reply-editor">
            {replyingTo && (() => {
              const replyTarget = replies.find(r => r.id === replyingTo);
              return (
                <div className="mb-2 text-sm text-gray-600">
                  Membalas ke: {replyTarget?.author?.fullName || 'Unknown User'}
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-2 text-red-600 hover:underline"
                  >
                    Batal
                  </button>
                </div>
              );
            })()}
            
            <RichTextEditor
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Tulis balasan Anda..."
              minHeight={120}
            />
            
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Kirim Balasan
              </button>
            </div>
          </div>

          {/* ✅ FIXED: Better replies display with debug info */}
          {replies.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada balasan. Jadilah yang pertama!</p>
              {/* ✅ DEBUG INFO: Show if we have any debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 text-xs text-gray-400">
                  <p>Debug: Post ID = {post.id}</p>
                  <p>Debug: Replies Count = {post.repliesCount}</p>
                  <p>Debug: Replies Array Length = {replies.length}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg border ${
                    reply.isAnswer 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Reply Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{reply.author?.fullName || 'Unknown User'}</h4>
                          {reply.isAnswer && (
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Jawaban Terbaik
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{getTimeAgo(reply.createdAt)}</p>
                      </div>
                    </div>
                    
                    {(user?.id === reply.authorId || canModerate) && (
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === reply.id ? null : reply.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {showActions === reply.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            {isOwner && !reply.isAnswer && (
                              <button
                                onClick={() => handleMarkAsAnswer(reply.id)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Tandai sebagai Jawaban
                              </button>
                            )}
                            {user?.id === reply.authorId && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingReply(reply.id);
                                    setEditContent(reply.content);
                                    setShowActions(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteReply(reply.id)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reply Content */}
                  {editingReply === reply.id ? (
                    <div className="space-y-3">
                      <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        minHeight={120}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateReply(reply.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setEditingReply(null);
                            setEditContent('');
                          }}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none mb-3"
                      dangerouslySetInnerHTML={{ __html: reply.content }}
                    />
                  )}

                  {/* Nested Replies */}
                  {reply.children && reply.children.length > 0 && (
                    <div className="mt-4 ml-8 space-y-3">
                      <button
                        onClick={() => toggleReplyExpansion(reply.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        {expandedReplies.has(reply.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Sembunyikan {reply.children.length} balasan
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Lihat {reply.children.length} balasan
                          </>
                        )}
                      </button>
                      
                      {expandedReplies.has(reply.id) && (
                        <div className="space-y-3">
                          {reply.children.map((nestedReply) => (
                            <div key={nestedReply.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{nestedReply.author?.fullName || 'Unknown User'}</p>
                                  <p className="text-xs text-gray-500">{getTimeAgo(nestedReply.createdAt)}</p>
                                </div>
                              </div>
                              <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: nestedReply.content }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumDetailPage;