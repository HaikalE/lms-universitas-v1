import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Assignment, 
  AssignmentType, 
  Submission, 
  SubmissionStatus,
  UserRole,
  Grade
} from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  FileTextIcon,
  UploadIcon,
  SaveIcon,
  SendIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  StarIcon,
  UserIcon,
  DownloadIcon,
  FileIcon,
  TrashIcon,
  EditIcon
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';

const AssignmentDetailPage: React.FC = () => {
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Student submission states
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Lecturer grading states
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetail();
      if (user?.role === UserRole.LECTURER) {
        fetchSubmissions();
      }
    }
  }, [assignmentId, user]);

  const fetchAssignmentDetail = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignmentDetail(assignmentId!);
      setAssignment(response.data);
      
      // Load existing submission for student
      if (user?.role === UserRole.STUDENT && response.data.mySubmission) {
        setSubmissionContent(response.data.mySubmission.content || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat detail tugas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await assignmentService.getSubmissions(assignmentId!);
      setSubmissions(response.data);
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (assignment?.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!assignment.allowedFileTypes.includes(`.${fileExtension}`)) {
          setSubmitError(`File type tidak diizinkan. Hanya: ${assignment.allowedFileTypes.join(', ')}`);
          return;
        }
      }
      
      // Validate file size
      if (assignment?.maxFileSize && file.size > assignment.maxFileSize * 1024 * 1024) {
        setSubmitError(`Ukuran file melebihi batas maksimal ${assignment.maxFileSize}MB`);
        return;
      }
      
      setSubmissionFile(file);
      setSubmitError(null);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const formData = new FormData();
      formData.append('content', submissionContent);
      formData.append('status', isDraft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED);
      
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      
      await assignmentService.submitAssignment(assignmentId!, formData);
      setSubmitSuccess(true);
      
      // Reload assignment to get updated submission
      await fetchAssignmentDetail();
      
      if (!isDraft) {
        setTimeout(() => {
          navigate('/assignments');
        }, 2000);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Gagal mengirim tugas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !gradeScore) return;
    
    try {
      setGrading(true);
      await assignmentService.gradeSubmission(selectedSubmission.id, {
        score: parseFloat(gradeScore),
        feedback: gradeFeedback
      });
      
      // Refresh submissions
      await fetchSubmissions();
      setSelectedSubmission(null);
      setGradeScore('');
      setGradeFeedback('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memberikan nilai');
    } finally {
      setGrading(false);
    }
  };

  const getAssignmentTypeIcon = (type: AssignmentType) => {
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
        return 'Tugas Individu';
      case AssignmentType.GROUP:
        return 'Tugas Kelompok';
      case AssignmentType.QUIZ:
        return 'Quiz';
      case AssignmentType.EXAM:
        return 'Ujian';
      default:
        return type;
    }
  };

  const isOverdue = () => {
    if (!assignment) return false;
    return isAfter(new Date(), new Date(assignment.dueDate));
  };

  const canSubmit = () => {
    if (!assignment || assignment.mySubmission?.status === SubmissionStatus.GRADED) return false;
    if (isOverdue() && !assignment.allowLateSubmission) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="large" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <Alert variant="error">
        <AlertCircleIcon className="w-4 h-4" />
        <span>{error || 'Tugas tidak ditemukan'}</span>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600">
            {assignment.course.code} - {assignment.course.name}
          </p>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detail Tugas</CardTitle>
                <Badge variant="primary">
                  {getAssignmentTypeIcon(assignment.type)}
                  <span className="ml-2">{getAssignmentTypeLabel(assignment.type)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </CardContent>
          </Card>

          {/* Submission Form for Students */}
          {user?.role === UserRole.STUDENT && (
            <Card>
              <CardHeader>
                <CardTitle>Pengumpulan Tugas</CardTitle>
              </CardHeader>
              <CardContent>
                {assignment.mySubmission?.status === SubmissionStatus.GRADED ? (
                  <div className="space-y-4">
                    <Alert variant="success">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Tugas Anda sudah dinilai</span>
                    </Alert>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Nilai:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {assignment.mySubmission.grade?.score}/{assignment.mySubmission.grade?.maxScore}
                        </span>
                      </div>
                      {assignment.mySubmission.grade?.feedback && (
                        <div className="mt-4">
                          <p className="font-semibold mb-2">Feedback:</p>
                          <p className="text-gray-700">{assignment.mySubmission.grade.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submitSuccess && (
                      <Alert variant="success">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Tugas berhasil dikirim!</span>
                      </Alert>
                    )}
                    
                    {submitError && (
                      <Alert variant="error">
                        <AlertCircleIcon className="w-4 h-4" />
                        <span>{submitError}</span>
                      </Alert>
                    )}
                    
                    {isOverdue() && !assignment.allowLateSubmission && (
                      <Alert variant="error">
                        <AlertCircleIcon className="w-4 h-4" />
                        <span>Waktu pengumpulan telah berakhir</span>
                      </Alert>
                    )}
                    
                    {isOverdue() && assignment.allowLateSubmission && (
                      <Alert variant="warning">
                        <AlertCircleIcon className="w-4 h-4" />
                        <span>
                          Pengumpulan terlambat akan dikenakan penalti {assignment.latePenaltyPercent}%
                        </span>
                      </Alert>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jawaban/Deskripsi
                      </label>
                      <Textarea
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        rows={6}
                        placeholder="Tulis jawaban atau deskripsi tugas Anda di sini..."
                        disabled={!canSubmit()}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload File
                        {assignment.allowedFileTypes.length > 0 && (
                          <span className="text-gray-500 font-normal ml-2">
                            ({assignment.allowedFileTypes.join(', ')}, Max: {assignment.maxFileSize}MB)
                          </span>
                        )}
                      </label>
                      <Input
                        type="file"
                        onChange={handleFileChange}
                        accept={assignment.allowedFileTypes.join(',')}
                        disabled={!canSubmit()}
                      />
                      {submissionFile && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <FileIcon className="w-4 h-4" />
                          <span>{submissionFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSubmissionFile(null)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmit(true)}
                        variant="outline"
                        disabled={!canSubmit() || submitting}
                      >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Simpan Draft
                      </Button>
                      <Button
                        onClick={() => handleSubmit(false)}
                        disabled={!canSubmit() || submitting || (!submissionContent && !submissionFile)}
                      >
                        {submitting ? (
                          <Loader size="small" className="mr-2" />
                        ) : (
                          <SendIcon className="w-4 h-4 mr-2" />
                        )}
                        Kirim Tugas
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submissions List for Lecturers */}
          {user?.role === UserRole.LECTURER && (
            <Card>
              <CardHeader>
                <CardTitle>Daftar Pengumpulan ({submissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Belum ada mahasiswa yang mengumpulkan tugas
                  </p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map(submission => (
                      <div
                        key={submission.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">
                                {submission.student?.fullName}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({submission.student?.studentId})
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Dikumpulkan: {format(new Date(submission.submittedAt!), 'dd MMMM yyyy HH:mm', { locale: id })}
                              {submission.isLate && (
                                <Badge variant="warning" className="ml-2">
                                  Terlambat
                                </Badge>
                              )}
                            </div>
                          </div>
                          {submission.grade ? (
                            <Badge variant="success">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Dinilai: {submission.grade.score}/{submission.grade.maxScore}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setGradeScore('');
                                setGradeFeedback('');
                              }}
                            >
                              <StarIcon className="w-4 h-4 mr-1" />
                              Beri Nilai
                            </Button>
                          )}
                        </div>
                        
                        {submission.content && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            {submission.content}
                          </div>
                        )}
                        
                        {submission.fileName && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/uploads/${submission.filePath}`, '_blank')}
                            >
                              <DownloadIcon className="w-4 h-4 mr-2" />
                              {submission.fileName}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Tugas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Dosen Pengampu</p>
                <p className="font-semibold">{assignment.lecturer.fullName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(assignment.dueDate), 'dd MMMM yyyy HH:mm', { locale: id })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Nilai Maksimal</p>
                <p className="font-semibold">{assignment.maxScore} poin</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Pengumpulan Terlambat</p>
                <p className="font-semibold">
                  {assignment.allowLateSubmission
                    ? `Diizinkan (Penalti ${assignment.latePenaltyPercent}%)`
                    : 'Tidak Diizinkan'}
                </p>
              </div>
              
              {assignment.allowedFileTypes.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Tipe File</p>
                  <p className="font-semibold">{assignment.allowedFileTypes.join(', ')}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Ukuran File Maksimal</p>
                <p className="font-semibold">{assignment.maxFileSize} MB</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Beri Nilai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Mahasiswa</p>
                <p className="font-semibold">
                  {selectedSubmission.student?.fullName} ({selectedSubmission.student?.studentId})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nilai (Max: {assignment.maxScore})
                </label>
                <Input
                  type="number"
                  min="0"
                  max={assignment.maxScore}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Opsional)
                </label>
                <Textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  rows={4}
                  placeholder="Berikan feedback untuk mahasiswa..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                  disabled={grading}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleGradeSubmission}
                  disabled={!gradeScore || grading}
                >
                  {grading ? (
                    <Loader size="small" className="mr-2" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                  )}
                  Simpan Nilai
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailPage;