import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Bookmark, 
  TrendingUp, 
  Award,
  Users,
  Clock,
  Heart,
  Brain,
  Target,
  Calendar,
  Trophy,
  Star,
  MessageCircle,
  Eye,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import InteractivePostCard from '../../components/ui/InteractivePostCard';
import { useAuth } from '../../contexts/AuthContext';
import { forumService, courseService } from '../../services';
import { ForumPost, Course } from '../../types';

interface StudentStats {
  questionsAsked: number;
  answersGiven: number;
  bestAnswers: number;
  reputationPoints: number;
  weeklyActivity: number;
  totalViews: number;
  helpfulVotes: number;
  studyStreak: number;
}

interface ActivityItem {
  id: string;
  type: 'question' | 'answer' | 'like' | 'best_answer' | 'mention';
  title: string;
  description: string;
  timestamp: string;
  postId?: string;
  points?: number;
}

const StudentForumDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'my-posts' | 'bookmarks' | 'activity' | 'groups'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats>({
    questionsAsked: 0,
    answersGiven: 0,
    bestAnswers: 0,
    reputationPoints: 0,
    weeklyActivity: 0,
    totalViews: 0,
    helpfulVotes: 0,
    studyStreak: 0
  });
  
  const [myPosts, setMyPosts] = useState<ForumPost[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<ForumPost[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
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
      
      // Calculate stats from posts
      const questionsAsked = myPostsData.filter(p => p.type === 'question').length;
      const answersGiven = myPostsData.filter(p => p.parent && !p.isAnswer).length;
      const bestAnswers = myPostsData.filter(p => p.isAnswer).length;
      const totalViews = myPostsData.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
      const helpfulVotes = myPostsData.reduce((sum, p) => sum + (p.likesCount || 0), 0);
      
      setStats({
        questionsAsked,
        answersGiven,
        bestAnswers,
        reputationPoints: (bestAnswers * 25) + (answersGiven * 10) + (questionsAsked * 5),
        weeklyActivity: Math.min(myPostsData.length, 50),
        totalViews,
        helpfulVotes,
        studyStreak: Math.floor(Math.random() * 15) + 1 // Mock data
      });
      
      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'best_answer',
          title: 'Jawaban Anda dipilih sebagai yang terbaik!',
          description: 'Pertanyaan: "Bagaimana cara implementasi Redux..."',
          timestamp: new Date().toISOString(),
          points: 25
        },
        {
          id: '2', 
          type: 'like',
          title: 'Pertanyaan Anda mendapat 5 likes',
          description: 'Pertanyaan: "Penjelasan tentang useState..."',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          points: 5
        }
      ]);
      
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

  const getReputationLevel = (points: number) => {
    if (points >= 1000) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (points >= 500) return { level: 'Helper', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (points >= 100) return { level: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
    return { level: 'Newbie', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'answer': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'best_answer': return <Award className="w-4 h-4 text-yellow-500" />;
      case 'mention': return <Users className="w-4 h-4 text-purple-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
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

  const reputationLevel = getReputationLevel(stats.reputationPoints);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Forum Dashboard</h1>
            <p className="text-blue-100">Selamat datang, {user?.fullName}!</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${reputationLevel.bg} ${reputationLevel.color} font-semibold flex items-center gap-2 mt-4 md:mt-0`}>
            <Star className="w-5 h-5" />
            {reputationLevel.level}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pertanyaan</p>
                <p className="text-2xl font-bold">{stats.questionsAsked}</p>
              </div>
              <MessageCircle className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Jawaban</p>
                <p className="text-2xl font-bold">{stats.answersGiven}</p>
              </div>
              <MessageSquare className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Jawaban Terbaik</p>
                <p className="text-2xl font-bold">{stats.bestAnswers}</p>
              </div>
              <Award className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Poin Reputasi</p>
                <p className="text-2xl font-bold">{stats.reputationPoints}</p>
              </div>
              <Trophy className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Ringkasan', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'my-posts', label: 'Post Saya', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'bookmarks', label: 'Tersimpan', icon: <Bookmark className="w-4 h-4" /> },
          { id: 'activity', label: 'Aktivitas', icon: <Clock className="w-4 h-4" /> },
          { id: 'groups', label: 'Grup Belajar', icon: <Users className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium
              ${activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Aktivitas Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="p-2 rounded-full bg-white">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.points && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          +{activity.points} pts
                        </span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => navigate('/forums/create')}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Buat Pertanyaan Baru
                  </button>
                  
                  <button
                    onClick={() => navigate('/forums?filter=unanswered')}
                    className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Brain className="w-5 h-5" />
                    Bantu Teman Menjawab
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('groups')}
                    className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Gabung Grup Belajar
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'my-posts' && (
          <div className="space-y-4">
            {/* Filters */}
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

            {/* Posts */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <InteractivePostCard
                  key={post.id}
                  post={post}
                  onQuickReact={handleQuickReact}
                  onBookmark={handleBookmark}
                  showReactionBar={true}
                />
              ))}
              
              {filteredPosts.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada post yang ditemukan</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <Card>
            <CardContent className="text-center py-8">
              <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Fitur bookmark sedang dalam pengembangan</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Detail aktivitas sedang dalam pengembangan</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'groups' && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Fitur grup belajar sedang dalam pengembangan</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentForumDashboard;