import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import InteractivePostCard from '../../components/ui/InteractivePostCard';
import { useAuth } from '../../contexts/AuthContext';
import { forumService, courseService } from '../../services';
import { ForumPost, Course } from '../../types';

const StudentForumDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<ForumPost[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'questions' | 'answers'>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's courses
      const coursesData = await courseService.getMyCourses();
      setCourses(coursesData || []);
      
      // Fetch user's forum posts
      const myPostsData = await forumService.getMyDiscussions();
      setMyPosts(myPostsData || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReact = async (postId: string, reactionType: string) => {
    try {
      await forumService.toggleLike(postId);
      // Update local state
      fetchDashboardData();
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      // Note: This would need to be implemented in the backend
      console.log('Bookmark post:', postId);
      // await forumService.toggleBookmark(postId);
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const filteredPosts = myPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'questions' && post.type === 'question') ||
                         (filterType === 'answers' && post.parent);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

      {/* Simple Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Saya</h1>
        <p className="text-gray-600">Kelola diskusi dan pertanyaan yang pernah Anda buat</p>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/forums/create')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Buat Diskusi Baru
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari dalam post saya..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Post</option>
              <option value="questions">Pertanyaan</option>
              <option value="answers">Jawaban</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterType !== 'all' ? 'Tidak ada post yang ditemukan' : 'Belum ada post'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterType !== 'all' 
                  ? 'Coba ubah pencarian atau filter Anda'
                  : 'Mulai diskusi atau ajukan pertanyaan untuk membantu sesama!'
                }
              </p>
              {!searchQuery && filterType === 'all' && (
                <button
                  onClick={() => navigate('/forums/create')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Buat Post Pertama
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <InteractivePostCard
              key={post.id}
              post={post}
              onQuickReact={handleQuickReact}
              onBookmark={handleBookmark}
              showReactionBar={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StudentForumDashboard;