import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Search,
  Filter,
  Plus,
  TrendingUp,
  MessageCircle,
  Heart,
  Eye,
  ChevronRight,
  BookOpen,
  Tag,
  Calendar,
  User,
  Sparkles,
  Target,
  Zap,
  Coffee
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import InteractivePostCard from '../../components/ui/InteractivePostCard';
import { useAuth } from '../../contexts/AuthContext';
import { forumService, courseService } from '../../services';
import { Course, ForumPost } from '../../types';

const ForumsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered' | 'trending'>('latest');
  const [filterType, setFilterType] = useState<'all' | 'questions' | 'discussions' | 'answered' | 'unanswered'>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'my-courses' | 'trending' | 'need-help'>('all');

  const isLecturer = user?.role === 'lecturer';
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchData();
  }, [selectedCourse, sortBy, filterType, quickFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's courses
      const coursesResponse = await courseService.getMyCourses();
      setCourses(coursesResponse || []);

      // Fetch forum posts based on filters
      const params: any = {
        sort: sortBy,
        search: searchQuery
      };
      
      let allPosts: ForumPost[] = [];
      
      if (selectedCourse !== 'all') {
        // Get posts for specific course
        const postsResponse = await forumService.getForumPosts(selectedCourse, params);
        allPosts = postsResponse.data || [];
      } else {
        // Get posts for all user's courses
        const courseList = coursesResponse || [];
        const postPromises = courseList.map(course => 
          forumService.getForumPosts(course.id, params).catch(() => ({ data: [] }))
        );
        
        const postsResponses = await Promise.all(postPromises);
        allPosts = postsResponses.flatMap(response => response.data || []);
        
        // Sort all posts by creation date if getting from multiple courses
        if (sortBy === 'latest') {
          allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'popular') {
          allPosts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        } else if (sortBy === 'trending') {
          // Sort by recent activity and likes
          allPosts.sort((a, b) => {
            const aScore = (a.likesCount || 0) + (a.children?.length || 0) + (a.viewsCount || 0) * 0.1;
            const bScore = (b.likesCount || 0) + (b.children?.length || 0) + (b.viewsCount || 0) * 0.1;
            return bScore - aScore;
          });
        }
      }

      // Apply type filter
      if (filterType !== 'all') {
        allPosts = allPosts.filter(post => {
          switch (filterType) {
            case 'questions': return post.type === 'question';
            case 'discussions': return post.type === 'discussion';
            case 'answered': return post.isAnswered === true;
            case 'unanswered': return post.type === 'question' && !post.isAnswered;
            default: return true;
          }
        });
      }

      // Apply quick filter
      if (quickFilter !== 'all') {
        allPosts = allPosts.filter(post => {
          switch (quickFilter) {
            case 'my-courses': return coursesResponse?.some(c => c.id === post.courseId);
            case 'trending': return (post.likesCount || 0) > 5 || (post.viewsCount || 0) > 50;
            case 'need-help': return post.type === 'question' && !post.isAnswered;
            default: return true;
          }
        });
      }

      setForumPosts(allPosts);
    } catch (error) {
      console.error('Error fetching forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleQuickReact = async (postId: string, reactionType: string) => {
    try {
      await forumService.toggleLike(postId);
      // Update local state
      setForumPosts(posts => 
        posts.map(post => 
          post.id === postId 
            ? { ...post, likesCount: (post.likesCount || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      // This would need backend implementation
      console.log('Bookmark post:', postId);
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const quickFilters = [
    { id: 'all', label: 'Semua', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'my-courses', label: 'Mata Kuliah Saya', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'need-help', label: 'Butuh Bantuan', icon: <Target className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Minimalist Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forum Diskusi</h1>
        <p className="text-gray-600 mb-6">Tempat belajar bersama dan berbagi pengetahuan</p>
        
        <div className="flex justify-center gap-3">
          {isStudent && (
            <button
              onClick={() => navigate('/forums/dashboard')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <User className="w-5 h-5" />
              Dashboard Saya
            </button>
          )}
          
          <button
            onClick={() => navigate('/forums/create')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Buat Diskusi Baru
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quickFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setQuickFilter(filter.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${quickFilter === filter.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </div>

      {/* Enhanced Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Course Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Mata Kuliah
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Mata Kuliah</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Jenis
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua Jenis</option>
                <option value="questions">Pertanyaan</option>
                <option value="discussions">Diskusi</option>
                <option value="answered">Sudah Dijawab</option>
                <option value="unanswered">Belum Dijawab</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">Terbaru</option>
                <option value="popular">Terpopuler</option>
                <option value="trending">Trending</option>
                <option value="unanswered">Belum Terjawab</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Cari
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari diskusi..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forum Posts List */}
      <div className="space-y-4">
        {forumPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {quickFilter === 'need-help' ? 'Tidak ada yang membutuhkan bantuan' : 'Belum ada diskusi'}
              </h3>
              <p className="text-gray-500 mb-4">
                {quickFilter === 'need-help' 
                  ? 'Semua pertanyaan sudah terjawab! 🎉'
                  : 'Jadilah yang pertama memulai diskusi!'
                }
              </p>
              {quickFilter !== 'need-help' && (
                <button
                  onClick={() => navigate('/forums/create')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mulai Diskusi Baru
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          forumPosts.map((post) => (
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

      {/* Load More Button */}
      {forumPosts.length >= 10 && (
        <div className="text-center">
          <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto">
            <Coffee className="w-5 h-5" />
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </div>
  );
};

export default ForumsPage;