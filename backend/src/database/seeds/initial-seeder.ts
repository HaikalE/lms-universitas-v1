import { DataSource } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Course } from '../../entities/course.entity';
import { ForumPost, ForumPostType } from '../../entities/forum-post.entity';
import * as bcrypt from 'bcrypt';

export class InitialSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('🌱 Running initial seeder...');

    const userRepository = dataSource.getRepository(User);
    const courseRepository = dataSource.getRepository(Course);
    const forumPostRepository = dataSource.getRepository(ForumPost);

    try {
      // Check if data already exists
      const userCount = await userRepository.count();
      if (userCount > 0) {
        console.log('✅ Data already exists, skipping seeder');
        return;
      }

      // Create Admin User
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = userRepository.create({
        email: 'admin@university.edu',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true,
        studentId: null,
        employeeId: 'ADM001',
        phone: '+62812345678',
        address: 'University Campus',
        avatar: null,
        bio: 'System Administrator for LMS',
      });

      const savedAdmin = await userRepository.save(admin);
      console.log('✅ Admin user created:', savedAdmin.email);

      // Create Lecturer User
      const lecturerPassword = await bcrypt.hash('lecturer123', 10);
      
      const lecturer = userRepository.create({
        email: 'lecturer@university.edu',
        password: lecturerPassword,
        fullName: 'Dr. John Doe',
        role: UserRole.LECTURER,
        isActive: true,
        studentId: null,
        employeeId: 'LEC001',
        phone: '+62812345679',
        address: 'University Campus',
        avatar: null,
        bio: 'Computer Science Lecturer',
      });

      const savedLecturer = await userRepository.save(lecturer);
      console.log('✅ Lecturer user created:', savedLecturer.email);

      // Create Student User
      const studentPassword = await bcrypt.hash('student123', 10);
      
      const student = userRepository.create({
        email: 'student@university.edu',
        password: studentPassword,
        fullName: 'Alice Smith',
        role: UserRole.STUDENT,
        isActive: true,
        studentId: 'STU001',
        employeeId: null,
        phone: '+62812345680',
        address: 'Student Dormitory',
        avatar: null,
        bio: 'Computer Science Student',
      });

      const savedStudent = await userRepository.save(student);
      console.log('✅ Student user created:', savedStudent.email);

      // Create Sample Course
      const course = courseRepository.create({
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Basic concepts of computer science including programming, algorithms, and data structures.',
        credits: 3,
        lecturerId: savedLecturer.id,
        semester: 'Fall 2024',
        isActive: true,
        maxStudents: 30,
        schedule: 'Monday & Wednesday 10:00-11:30',
        location: 'Room A101',
        syllabus: 'Introduction to programming concepts, data structures, and basic algorithms.',
      });

      const savedCourse = await courseRepository.save(course);
      console.log('✅ Sample course created:', savedCourse.code);

      // Enroll student in course
      savedCourse.students = [savedStudent];
      await courseRepository.save(savedCourse);
      console.log('✅ Student enrolled in course');

      // Create Sample Forum Posts
      const forumPost1 = forumPostRepository.create({
        title: 'Welcome to CS101 Forum',
        content: 'This is the main discussion forum for CS101. Feel free to ask questions and share resources.',
        type: ForumPostType.ANNOUNCEMENT,
        courseId: savedCourse.id,
        authorId: savedLecturer.id,
        isPinned: true,
        isLocked: false,
        likesCount: 0,
        viewsCount: 0,
        repliesCount: 0,
        isAnswer: false,
        isAnswered: false,
      });

      const savedPost1 = await forumPostRepository.save(forumPost1);
      console.log('✅ Welcome forum post created');

      const forumPost2 = forumPostRepository.create({
        title: 'Question about Assignment 1',
        content: 'Hi everyone, I have a question about the first assignment. Can someone help me understand the requirements for the algorithm implementation?',
        type: ForumPostType.QUESTION,
        courseId: savedCourse.id,
        authorId: savedStudent.id,
        isPinned: false,
        isLocked: false,
        likesCount: 2,
        viewsCount: 15,
        repliesCount: 1,
        isAnswer: false,
        isAnswered: true,
      });

      const savedPost2 = await forumPostRepository.save(forumPost2);
      console.log('✅ Question forum post created');

      // Create a reply to the question
      const reply = forumPostRepository.create({
        title: 'Re: Question about Assignment 1',
        content: 'You need to implement a sorting algorithm using the bubble sort method. Check the lecture slides for reference.',
        type: ForumPostType.DISCUSSION,
        courseId: savedCourse.id,
        authorId: savedLecturer.id,
        parentId: savedPost2.id,
        isPinned: false,
        isLocked: false,
        likesCount: 1,
        viewsCount: 5,
        repliesCount: 0,
        isAnswer: true,
        isAnswered: false,
      });

      await forumPostRepository.save(reply);
      console.log('✅ Reply forum post created');

      console.log('🎉 Initial seeder completed successfully!');
      console.log('📧 Login credentials:');
      console.log('   Admin: admin@university.edu / admin123');
      console.log('   Lecturer: lecturer@university.edu / lecturer123');
      console.log('   Student: student@university.edu / student123');

    } catch (error) {
      console.error('❌ Seeder failed:', error.message);
      throw error;
    }
  }
}