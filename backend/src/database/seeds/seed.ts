import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../entities/user.entity';
import { Course } from '../../entities/course.entity';
import { Assignment, AssignmentType } from '../../entities/assignment.entity';
import { CourseMaterial, MaterialType } from '../../entities/course-material.entity';
import { Announcement, AnnouncementPriority } from '../../entities/announcement.entity';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize data source
    await AppDataSource.initialize();
    
    const userRepository = AppDataSource.getRepository(User);
    const courseRepository = AppDataSource.getRepository(Course);
    const assignmentRepository = AppDataSource.getRepository(Assignment);
    const materialRepository = AppDataSource.getRepository(CourseMaterial);
    const announcementRepository = AppDataSource.getRepository(Announcement);

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await announcementRepository.delete({});
    await materialRepository.delete({});
    await assignmentRepository.delete({});
    await AppDataSource.query('DELETE FROM course_enrollments');
    await courseRepository.delete({});
    await userRepository.delete({});

    // Create admin user
    console.log('👨‍💼 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      email: 'admin@universitas.ac.id',
      password: adminPassword,
      fullName: 'Administrator Sistem',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(admin);

    // Create lecturers
    console.log('👨‍🏫 Creating lecturers...');
    const lecturerPassword = await bcrypt.hash('lecturer123', 10);
    
    const lecturer1 = userRepository.create({
      email: 'dr.ahmad@universitas.ac.id',
      password: lecturerPassword,
      fullName: 'Dr. Ahmad Budi Santoso, M.Kom',
      lecturerId: 'NIDN001',
      role: UserRole.LECTURER,
      phone: '08123456789',
      isActive: true,
    });

    const lecturer2 = userRepository.create({
      email: 'dr.sari@universitas.ac.id',
      password: lecturerPassword,
      fullName: 'Dr. Sari Dewi Lestari, M.T',
      lecturerId: 'NIDN002',
      role: UserRole.LECTURER,
      phone: '08123456790',
      isActive: true,
    });

    const lecturer3 = userRepository.create({
      email: 'prof.hendra@universitas.ac.id',
      password: lecturerPassword,
      fullName: 'Prof. Dr. Hendra Wijaya, Ph.D',
      lecturerId: 'NIDN003',
      role: UserRole.LECTURER,
      phone: '08123456791',
      isActive: true,
    });

    await userRepository.save([lecturer1, lecturer2, lecturer3]);

    // Create students
    console.log('👨‍🎓 Creating students...');
    const studentPassword = await bcrypt.hash('student123', 10);
    
    const students = [];
    const studentData = [
      { name: 'Andi Pratama', nim: '20230001', email: 'andi.pratama@student.ac.id' },
      { name: 'Siti Nurhaliza', nim: '20230002', email: 'siti.nurhaliza@student.ac.id' },
      { name: 'Budi Setiawan', nim: '20230003', email: 'budi.setiawan@student.ac.id' },
      { name: 'Dewi Sartika', nim: '20230004', email: 'dewi.sartika@student.ac.id' },
      { name: 'Rahman Hidayat', nim: '20230005', email: 'rahman.hidayat@student.ac.id' },
      { name: 'Maya Sari', nim: '20230006', email: 'maya.sari@student.ac.id' },
      { name: 'Fajar Nugroho', nim: '20230007', email: 'fajar.nugroho@student.ac.id' },
      { name: 'Indira Putri', nim: '20230008', email: 'indira.putri@student.ac.id' },
      { name: 'Yoga Pratama', nim: '20230009', email: 'yoga.pratama@student.ac.id' },
      { name: 'Lina Marlina', nim: '20230010', email: 'lina.marlina@student.ac.id' },
    ];

    for (const data of studentData) {
      const student = userRepository.create({
        email: data.email,
        password: studentPassword,
        fullName: data.name,
        studentId: data.nim,
        role: UserRole.STUDENT,
        isActive: true,
      });
      students.push(student);
    }
    await userRepository.save(students);

    // Create courses
    console.log('📚 Creating courses...');
    const course1 = courseRepository.create({
      code: 'CS101',
      name: 'Pengantar Ilmu Komputer',
      description: 'Mata kuliah pengantar yang membahas dasar-dasar ilmu komputer, algoritma, dan pemrograman.',
      credits: 3,
      semester: '2024/1',
      lecturer: lecturer1,
      lecturerId: lecturer1.id,
      isActive: true,
    });

    const course2 = courseRepository.create({
      code: 'CS201',
      name: 'Struktur Data dan Algoritma',
      description: 'Mata kuliah yang membahas berbagai struktur data dan algoritma untuk menyelesaikan masalah komputasi.',
      credits: 4,
      semester: '2024/1',
      lecturer: lecturer1,
      lecturerId: lecturer1.id,
      isActive: true,
    });

    const course3 = courseRepository.create({
      code: 'CS301',
      name: 'Basis Data',
      description: 'Mata kuliah yang membahas konsep, desain, dan implementasi sistem basis data.',
      credits: 3,
      semester: '2024/1',
      lecturer: lecturer2,
      lecturerId: lecturer2.id,
      isActive: true,
    });

    const course4 = courseRepository.create({
      code: 'CS401',
      name: 'Rekayasa Perangkat Lunak',
      description: 'Mata kuliah yang membahas metodologi pengembangan perangkat lunak skala besar.',
      credits: 4,
      semester: '2024/1',
      lecturer: lecturer3,
      lecturerId: lecturer3.id,
      isActive: true,
    });

    await courseRepository.save([course1, course2, course3, course4]);

    // Enroll students to courses
    console.log('📝 Enrolling students to courses...');
    
    // Enroll first 5 students to course1
    course1.students = students.slice(0, 5);
    
    // Enroll students 3-8 to course2
    course2.students = students.slice(2, 8);
    
    // Enroll students 1-6 to course3
    course3.students = students.slice(1, 7);
    
    // Enroll students 4-9 to course4
    course4.students = students.slice(4, 10);

    await courseRepository.save([course1, course2, course3, course4]);

    // Create course materials
    console.log('📖 Creating course materials...');
    
    const materials = [
      {
        course: course1,
        title: 'Pengantar Pemrograman',
        description: 'Materi pengantar pemrograman dengan bahasa Python',
        type: MaterialType.PDF,
        week: 1,
        orderIndex: 1,
        uploadedBy: lecturer1,
      },
      {
        course: course1,
        title: 'Video Tutorial: Hello World',
        description: 'Video tutorial membuat program Hello World pertama',
        type: MaterialType.VIDEO,
        url: 'https://youtube.com/watch?v=example1',
        week: 1,
        orderIndex: 2,
        uploadedBy: lecturer1,
      },
      {
        course: course2,
        title: 'Array dan Linked List',
        description: 'Penjelasan struktur data array dan linked list',
        type: MaterialType.PRESENTATION,
        week: 1,
        orderIndex: 1,
        uploadedBy: lecturer1,
      },
      {
        course: course3,
        title: 'Entity Relationship Diagram',
        description: 'Konsep dan praktik pembuatan ERD',
        type: MaterialType.DOCUMENT,
        week: 1,
        orderIndex: 1,
        uploadedBy: lecturer2,
      },
    ];

    for (const materialData of materials) {
      const material = materialRepository.create({
        ...materialData,
        courseId: materialData.course.id,
        uploadedById: materialData.uploadedBy.id,
      });
      await materialRepository.save(material);
    }

    // Create assignments
    console.log('📋 Creating assignments...');
    
    const assignment1 = assignmentRepository.create({
      title: 'Tugas 1: Program Hello World',
      description: 'Buatlah program sederhana yang menampilkan "Hello World" menggunakan bahasa pemrograman Python. Upload file .py hasil program Anda.',
      type: AssignmentType.INDIVIDUAL,
      dueDate: new Date('2024-02-15'),
      maxScore: 100,
      allowedFileTypes: ['py', 'txt'],
      course: course1,
      courseId: course1.id,
      lecturer: lecturer1,
      lecturerId: lecturer1.id,
    });

    const assignment2 = assignmentRepository.create({
      title: 'Quiz 1: Konsep Dasar Algoritma',
      description: 'Quiz online tentang konsep dasar algoritma dan flowchart. Durasi 60 menit.',
      type: AssignmentType.QUIZ,
      dueDate: new Date('2024-02-20'),
      maxScore: 100,
      allowLateSubmission: false,
      course: course2,
      courseId: course2.id,
      lecturer: lecturer1,
      lecturerId: lecturer1.id,
    });

    const assignment3 = assignmentRepository.create({
      title: 'Project: Desain Database Perpustakaan',
      description: 'Desain database untuk sistem perpustakaan digital. Buatlah ERD, skema relasi, dan implementasi dalam MySQL.',
      type: AssignmentType.GROUP,
      dueDate: new Date('2024-03-01'),
      maxScore: 100,
      allowedFileTypes: ['pdf', 'sql', 'zip'],
      course: course3,
      courseId: course3.id,
      lecturer: lecturer2,
      lecturerId: lecturer2.id,
    });

    await assignmentRepository.save([assignment1, assignment2, assignment3]);

    // Create announcements
    console.log('📢 Creating announcements...');
    
    const announcement1 = announcementRepository.create({
      title: 'Selamat Datang di Semester Baru!',
      content: 'Selamat datang mahasiswa baru dan lama di semester 2024/1. Silakan periksa jadwal kuliah dan materi yang tersedia.',
      priority: AnnouncementPriority.HIGH,
      course: course1,
      courseId: course1.id,
      author: lecturer1,
      authorId: lecturer1.id,
    });

    const announcement2 = announcementRepository.create({
      title: 'Perubahan Jadwal Kuliah',
      content: 'Kuliah hari Jumat, 15 Februari 2024 dipindah ke hari Sabtu, 16 Februari 2024 pukul 08:00 WIB.',
      priority: AnnouncementPriority.URGENT,
      course: course2,
      courseId: course2.id,
      author: lecturer1,
      authorId: lecturer1.id,
    });

    const announcement3 = announcementRepository.create({
      title: 'Pengumuman Global: Libur Nasional',
      content: 'Semua kegiatan akademik diliburkan pada tanggal 17 Agustus 2024 dalam rangka Hari Kemerdekaan RI.',
      priority: AnnouncementPriority.MEDIUM,
      author: admin,
      authorId: admin.id,
      // courseId null untuk pengumuman global
    });

    await announcementRepository.save([announcement1, announcement2, announcement3]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Admin: 1 user`);
    console.log(`- Lecturers: 3 users`);
    console.log(`- Students: 10 users`);
    console.log(`- Courses: 4 courses`);
    console.log(`- Materials: 4 materials`);
    console.log(`- Assignments: 3 assignments`);
    console.log(`- Announcements: 3 announcements`);
    console.log('\n🔐 Default credentials:');
    console.log('Admin: admin@universitas.ac.id / admin123');
    console.log('Lecturer: dr.ahmad@universitas.ac.id / lecturer123');
    console.log('Student: andi.pratama@student.ac.id / student123');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Run the seed function
seed();
