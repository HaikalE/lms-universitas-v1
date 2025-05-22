import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1716390000000 implements MigrationInterface {
  name = 'InitialMigration1716390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'lecturer', 'student')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_materials_type_enum" AS ENUM('pdf', 'video', 'document', 'presentation', 'link')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignments_type_enum" AS ENUM('individual', 'group', 'quiz', 'exam')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."submissions_status_enum" AS ENUM('draft', 'submitted', 'late', 'graded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."announcements_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('assignment_new', 'assignment_due', 'assignment_graded', 'announcement', 'forum_reply', 'course_enrollment', 'general')`,
    );

    // Create users table
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "fullName" character varying NOT NULL,
        "studentId" character varying,
        "lecturerId" character varying,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'student',
        "phone" character varying,
        "address" character varying,
        "avatar" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_studentId" UNIQUE ("studentId"),
        CONSTRAINT "UQ_users_lecturerId" UNIQUE ("lecturerId"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )`,
    );

    // Create courses table
    await queryRunner.query(
      `CREATE TABLE "courses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "credits" integer NOT NULL,
        "semester" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lecturerId" uuid NOT NULL,
        CONSTRAINT "UQ_courses_code" UNIQUE ("code"),
        CONSTRAINT "PK_courses_id" PRIMARY KEY ("id")
      )`,
    );

    // Create course_enrollments table
    await queryRunner.query(
      `CREATE TABLE "course_enrollments" (
        "courseId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        CONSTRAINT "PK_course_enrollments" PRIMARY KEY ("courseId", "studentId")
      )`,
    );

    // Create course_materials table
    await queryRunner.query(
      `CREATE TABLE "course_materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "type" "public"."course_materials_type_enum" NOT NULL,
        "fileName" character varying,
        "filePath" character varying,
        "fileSize" integer,
        "url" character varying,
        "week" integer NOT NULL DEFAULT 1,
        "orderIndex" integer NOT NULL DEFAULT 1,
        "isVisible" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "courseId" uuid NOT NULL,
        "uploadedById" uuid NOT NULL,
        CONSTRAINT "PK_course_materials_id" PRIMARY KEY ("id")
      )`,
    );

    // Create assignments table
    await queryRunner.query(
      `CREATE TABLE "assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "type" "public"."assignments_type_enum" NOT NULL DEFAULT 'individual',
        "dueDate" TIMESTAMP NOT NULL,
        "maxScore" integer NOT NULL DEFAULT 100,
        "allowLateSubmission" boolean NOT NULL DEFAULT true,
        "latePenaltyPercent" integer NOT NULL DEFAULT 0,
        "allowedFileTypes" text array NOT NULL DEFAULT '{}',
        "maxFileSize" integer NOT NULL DEFAULT 10485760,
        "isVisible" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "courseId" uuid NOT NULL,
        "lecturerId" uuid NOT NULL,
        CONSTRAINT "PK_assignments_id" PRIMARY KEY ("id")
      )`,
    );

    // Create submissions table
    await queryRunner.query(
      `CREATE TABLE "submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text,
        "fileName" character varying,
        "filePath" character varying,
        "fileSize" integer,
        "status" "public"."submissions_status_enum" NOT NULL DEFAULT 'draft',
        "submittedAt" TIMESTAMP,
        "isLate" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "assignmentId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        CONSTRAINT "PK_submissions_id" PRIMARY KEY ("id")
      )`,
    );

    // Create grades table
    await queryRunner.query(
      `CREATE TABLE "grades" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "score" numeric(5,2) NOT NULL,
        "maxScore" numeric(5,2) NOT NULL,
        "feedback" text,
        "gradedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "courseId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "assignmentId" uuid NOT NULL,
        "submissionId" uuid,
        "gradedById" uuid NOT NULL,
        CONSTRAINT "PK_grades_id" PRIMARY KEY ("id"),
        CONSTRAINT "REL_grades_submissionId" UNIQUE ("submissionId")
      )`,
    );

    // Create forum_posts table
    await queryRunner.query(
      `CREATE TABLE "forum_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "isPinned" boolean NOT NULL DEFAULT false,
        "isLocked" boolean NOT NULL DEFAULT false,
        "likesCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "courseId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "mpath" character varying DEFAULT '',
        "parentId" uuid,
        CONSTRAINT "PK_forum_posts_id" PRIMARY KEY ("id")
      )`,
    );

    // Create announcements table
    await queryRunner.query(
      `CREATE TABLE "announcements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "priority" "public"."announcements_priority_enum" NOT NULL DEFAULT 'medium',
        "isActive" boolean NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "courseId" uuid,
        "authorId" uuid NOT NULL,
        CONSTRAINT "PK_announcements_id" PRIMARY KEY ("id")
      )`,
    );

    // Create notifications table
    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_lecturerId" FOREIGN KEY ("lecturerId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_course_enrollments_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_course_enrollments_studentId" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "course_materials" ADD CONSTRAINT "FK_course_materials_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "course_materials" ADD CONSTRAINT "FK_course_materials_uploadedById" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_lecturerId" FOREIGN KEY ("lecturerId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_submissions_assignmentId" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_submissions_studentId" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_studentId" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_assignmentId" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_submissionId" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE SET NULL`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_gradedById" FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_forum_posts_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_forum_posts_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "forum_posts" ADD CONSTRAINT "FK_forum_posts_parentId" FOREIGN KEY ("parentId") REFERENCES "forum_posts"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_courseId" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_authorId" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
    
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role" ON "users" ("role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_courses_semester" ON "courses" ("semester")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignments_dueDate" ON "assignments" ("dueDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_submissions_status" ON "submissions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_isRead" ON "notifications" ("isRead")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_notifications_isRead"`);
    await queryRunner.query(`DROP INDEX "IDX_submissions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_assignments_dueDate"`);
    await queryRunner.query(`DROP INDEX "IDX_courses_semester"`);
    await queryRunner.query(`DROP INDEX "IDX_users_role"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_userId"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_authorId"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_courseId"`);
    await queryRunner.query(`ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_forum_posts_parentId"`);
    await queryRunner.query(`ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_forum_posts_authorId"`);
    await queryRunner.query(`ALTER TABLE "forum_posts" DROP CONSTRAINT "FK_forum_posts_courseId"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_gradedById"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_submissionId"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_assignmentId"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_studentId"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_courseId"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_submissions_studentId"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_submissions_assignmentId"`);
    await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_assignments_lecturerId"`);
    await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_assignments_courseId"`);
    await queryRunner.query(`ALTER TABLE "course_materials" DROP CONSTRAINT "FK_course_materials_uploadedById"`);
    await queryRunner.query(`ALTER TABLE "course_materials" DROP CONSTRAINT "FK_course_materials_courseId"`);
    await queryRunner.query(`ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_course_enrollments_studentId"`);
    await queryRunner.query(`ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_course_enrollments_courseId"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_lecturerId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "forum_posts"`);
    await queryRunner.query(`DROP TABLE "grades"`);
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`DROP TABLE "assignments"`);
    await queryRunner.query(`DROP TABLE "course_materials"`);
    await queryRunner.query(`DROP TABLE "course_enrollments"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."announcements_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."submissions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."assignments_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."course_materials_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
