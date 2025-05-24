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
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { forumsApi } from '../../services/api';
import { Course, ForumPost } from '../../types';

interface ForumStats {
  totalPosts: number;
  totalReplies: number;
  activeUsers: number;
  todayPosts: number;
}

const ForumsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered'>('latest');
  const [stats, setStats] = useState<ForumStats>({
    totalPosts: 0,
    totalReplies: 0,
    activeUsers: 0,
    todayPosts: 0
  });

  const isLecturer = user?.role === 'lecturer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [selectedCourse, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's courses
      const coursesResponse = await forumsApi.getUserCourses();
      setCourses(coursesResponse.data);

      // Fetch forum posts
      const params: any = {
        sort: sortBy,
        search: searchQuery
      };
      
      if (selectedCourse !== 'all') {
        params.courseId = selectedCourse;
      }

      const postsResponse = await forumsApi.getForumPosts(params);
      setForumPosts(postsResponse.data);

      // Calculate stats
      const totalPosts = postsResponse.data.length;
      const totalReplies = postsResponse.data.reduce((sum: number, post: ForumPost) => 
        sum + (post.repliesCount || 0), 0
      );
      const uniqueUsers = new Set(postsResponse.data.map((post: ForumPost) => post.userId));
      const today = new Date().toDateString();
      const todayPosts = postsResponse.data.filter((post: ForumPost) => 
        new Date(post.createdAt).toDateString() === today
      ).length;

      setStats({
        totalPosts,
        totalReplies,
        activeUsers: uniqueUsers.size,
        todayPosts
      });
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

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'discussion':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'announcement':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Forum Diskusi</h1>
            <p className="text-blue-100">Tempat berdiskusi dan berbagi pengetahuan</p>
          </div>
          <button
            onClick={() => navigate('/forums/create')}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Buat Diskusi Baru
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-white/80" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-sm text-blue-100">Total Diskusi</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-white/80" />
              <div>
                <p className="text-2xl font-bold">{stats.totalReplies}</p>
                <p className="text-sm text-blue-100">Total Balasan</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-white/80" />
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-sm text-blue-100">Pengguna Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-white/80" />
              <div>
                <p className="text-2xl font-bold">{stats.todayPosts}</p>
                <p className="text-sm text-blue-100">Diskusi Hari Ini</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Course Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Filter Mata Kuliah
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

            {/* Sort Options */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">Terbaru</option>
                <option value="popular">Terpopuler</option>
                <option value="unanswered">Belum Terjawab</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Cari Diskusi
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul atau konten..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cari
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
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada diskusi
              </h3>
              <p className="text-gray-500 mb-4">
                Jadilah yang pertama memulai diskusi!
              </p>
              <button
                onClick={() => navigate('/forums/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mulai Diskusi Baru
              </button>
            </CardContent>
          </Card>
        ) : (
          forumPosts.map((post) => (
            <Card 
              key={post.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/forums/${post.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getPostTypeIcon(post.type)}
                      <span className="text-sm font-medium text-gray-500">
                        {post.course?.name}
                      </span>
                      {post.isPinned && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Pinned
                        </span>
                      )}
                      {post.isAnswered && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Terjawab
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Post Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.user?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{getTimeAgo(post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.viewsCount || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.repliesCount || 0} balasan</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likesCount || 0} likes</span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {forumPosts.length >= 10 && (
        <div className="text-center">
          <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </div>
  );
};

export default ForumsPage;