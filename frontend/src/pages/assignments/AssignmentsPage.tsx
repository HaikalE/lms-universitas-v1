import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment, AssignmentType, UserRole } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  CalendarIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique courses from assignments
  const uniqueCourses = Array.from(
    new Set(assignments.map(a => a.course.id))
  ).map(id => {
    const course = assignments.find(a => a.course.id === id)?.course;
    return course;
  }).filter(Boolean);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [searchTerm, selectedCourse, selectedType, selectedStatus, assignments]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignments();
      setAssignments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat daftar tugas');
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             a.course.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Course filter
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(a => a.course.id === selectedCourse);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    // Status filter (for students)
    if (selectedStatus !== 'all' && user?.role === UserRole.STUDENT) {
      const now = new Date();
      const isOverdue = (assignment: Assignment) => 
        new Date(assignment.dueDate) < now && !assignment.mySubmission?.submittedAt;

      switch (selectedStatus) {
        case 'pending':
          filtered = filtered.filter(a => !a.mySubmission?.submittedAt && !isOverdue(a));
          break;
        case 'submitted':
          filtered = filtered.filter(a => a.mySubmission?.submittedAt);
          break;
        case 'graded':
          filtered = filtered.filter(a => a.mySubmission?.grade);
          break;
        case 'overdue':
          filtered = filtered.filter(a => isOverdue(a));
          break;
      }
    }

    setFilteredAssignments(filtered);
  };

  const getAssignmentIcon = (type: AssignmentType) => {
    switch (type) {
      case AssignmentType.QUIZ:
        return <FileTextIcon className="w-5 h-5" />;
      case AssignmentType.EXAM:
        return <AlertCircleIcon className="w-5 h-5" />;
      default:
        return <FileTextIcon className="w-5 h-5" />;
    }
  };

  const getAssignmentTypeLabel = (type: AssignmentType) => {
    switch (type) {
      case AssignmentType.INDIVIDUAL:
        return 'Individu';
      case AssignmentType.GROUP:
        return 'Kelompok';
      case AssignmentType.QUIZ:
        return 'Quiz';
      case AssignmentType.EXAM:
        return 'Ujian';
      default:
        return type;
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (user?.role !== UserRole.STUDENT) return null;

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = dueDate < now;

    if (assignment.mySubmission?.grade) {
      return (
        <Badge variant="success">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Dinilai: {assignment.mySubmission.grade.score}/{assignment.mySubmission.grade.maxScore}
        </Badge>
      );
    }

    if (assignment.mySubmission?.submittedAt) {
      return (
        <Badge variant="default">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Sudah Dikumpulkan
        </Badge>
      );
    }

    if (isOverdue) {
      return (
        <Badge variant="error">
          <AlertCircleIcon className="w-3 h-3 mr-1" />
          Terlambat
        </Badge>
      );
    }

    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      return (
        <Badge variant="warning">
          <ClockIcon className="w-3 h-3 mr-1" />
          {daysLeft} hari lagi
        </Badge>
      );
    }

    return (
      <Badge variant="info">
        <ClockIcon className="w-3 h-3 mr-1" />
        Belum Dikumpulkan
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <AlertCircleIcon className="w-4 h-4" />
        <span>{error}</span>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tugas</h1>
        {user?.role === UserRole.LECTURER && (
          <Button onClick={() => navigate('/assignments/create')}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Buat Tugas Baru
          </Button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari tugas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              Filter
              {(selectedCourse !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
                <Badge variant="default" className="ml-2">
                  {[selectedCourse !== 'all', selectedType !== 'all', selectedStatus !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="Mata Kuliah"
              >
                <option value="all">Semua Mata Kuliah</option>
                {uniqueCourses.map(course => (
                  <option key={course!.id} value={course!.id}>
                    {course!.code} - {course!.name}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="Jenis Tugas"
              >
                <option value="all">Semua Jenis</option>
                <option value={AssignmentType.INDIVIDUAL}>Individu</option>
                <option value={AssignmentType.GROUP}>Kelompok</option>
                <option value={AssignmentType.QUIZ}>Quiz</option>
                <option value={AssignmentType.EXAM}>Ujian</option>
              </Select>

              {user?.role === UserRole.STUDENT && (
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Belum Dikumpulkan</option>
                  <option value="submitted">Sudah Dikumpulkan</option>
                  <option value="graded">Sudah Dinilai</option>
                  <option value="overdue">Terlambat</option>
                </Select>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {searchTerm || selectedCourse !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Tidak ada tugas yang sesuai dengan filter'
                : 'Belum ada tugas'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
           {filteredAssignments.map(assignment => (
            <div // Tambahkan div pembungkus di sini
              key={assignment.id}
              className="hover:shadow-lg transition-shadow cursor-pointer" // Pindahkan className ke sini
              onClick={() => navigate(`/assignments/${assignment.id}`)} // Pindahkan onClick ke sini
            >
              <Card> {/* Card sekarang tidak perlu onClick atau className untuk interaksi klik */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getAssignmentIcon(assignment.type)}
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        {/* Anda mungkin perlu memperbaiki Badge di sini juga jika masih "secondary" */}
                        <Badge variant="default"> 
                          {getAssignmentTypeLabel(assignment.type)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {assignment.course.code} - {assignment.course.name}
                      </div>
                      
                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {assignment.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Deadline: {format(new Date(assignment.dueDate), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
                        </div>
                        <div className="text-gray-600">
                          Nilai Maksimal: {assignment.maxScore}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {getStatusBadge(assignment)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;