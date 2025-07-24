import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoProgressAndAttendance1737700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ✨ Step 1: Add attendance trigger fields to course_materials table
    await queryRunner.query(`
      ALTER TABLE "course_materials" 
      ADD COLUMN "isAttendanceTrigger" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "course_materials" 
      ADD COLUMN "attendanceThreshold" double precision
    `);

    // ✨ Step 2: Create video_progress table
    await queryRunner.query(`
      CREATE TABLE "video_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "materialId" uuid NOT NULL,
        "currentTime" double precision NOT NULL DEFAULT '0',
        "totalDuration" double precision,
        "watchedPercentage" double precision NOT NULL DEFAULT '0',
        "watchedSeconds" double precision NOT NULL DEFAULT '0',
        "isCompleted" boolean NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP,
        "hasTriggeredAttendance" boolean NOT NULL DEFAULT false,
        "watchSessions" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_progress" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_video_progress_student_material" UNIQUE ("studentId", "materialId")
      )
    `);

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_video_progress_student_material" 
      ON "video_progress" ("studentId", "materialId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_video_progress_student" 
      ON "video_progress" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_video_progress_material" 
      ON "video_progress" ("materialId")
    `);

    // ✨ Step 3: Create attendances table
    await queryRunner.query(`
      CREATE TYPE "attendance_status_enum" AS ENUM(
        'present', 
        'absent', 
        'auto_present', 
        'excused', 
        'late'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "attendance_type_enum" AS ENUM(
        'manual', 
        'video_completion', 
        'qr_code', 
        'location_based'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "courseId" uuid NOT NULL,
        "triggerMaterialId" uuid,
        "attendanceDate" date NOT NULL,
        "status" "attendance_status_enum" NOT NULL DEFAULT 'present',
        "attendanceType" "attendance_type_enum" NOT NULL DEFAULT 'manual',
        "notes" text,
        "submittedAt" TIMESTAMP,
        "verifiedBy" uuid,
        "verifiedAt" TIMESTAMP,
        "metadata" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendances" PRIMARY KEY ("id")
      )
    `);

    // Add indexes for attendance queries
    await queryRunner.query(`
      CREATE INDEX "IDX_attendances_student_course_date" 
      ON "attendances" ("studentId", "courseId", "attendanceDate")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendances_course_date" 
      ON "attendances" ("courseId", "attendanceDate")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendances_student" 
      ON "attendances" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendances_course" 
      ON "attendances" ("courseId")
    `);

    // ✨ Step 4: Add foreign key constraints

    // Video progress foreign keys
    await queryRunner.query(`
      ALTER TABLE "video_progress" 
      ADD CONSTRAINT "FK_video_progress_student" 
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "video_progress" 
      ADD CONSTRAINT "FK_video_progress_material" 
      FOREIGN KEY ("materialId") REFERENCES "course_materials"("id") ON DELETE CASCADE
    `);

    // Attendance foreign keys
    await queryRunner.query(`
      ALTER TABLE "attendances" 
      ADD CONSTRAINT "FK_attendances_student" 
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "attendances" 
      ADD CONSTRAINT "FK_attendances_course" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "attendances" 
      ADD CONSTRAINT "FK_attendances_trigger_material" 
      FOREIGN KEY ("triggerMaterialId") REFERENCES "course_materials"("id") ON DELETE SET NULL
    `);

    // ✨ Step 5: Add comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE "video_progress" IS 'Tracks student video viewing progress for attendance and analytics'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "attendances" IS 'Student attendance records with support for auto-submission via video completion'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "course_materials"."isAttendanceTrigger" IS 'Flag to indicate if this video can trigger automatic attendance'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "course_materials"."attendanceThreshold" IS 'Custom completion threshold for this video (overrides global setting)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`ALTER TABLE "video_progress" DROP CONSTRAINT "FK_video_progress_student"`);
    await queryRunner.query(`ALTER TABLE "video_progress" DROP CONSTRAINT "FK_video_progress_material"`);
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_attendances_student"`);
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_attendances_course"`);
    await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_attendances_trigger_material"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_video_progress_student_material"`);
    await queryRunner.query(`DROP INDEX "IDX_video_progress_student"`);
    await queryRunner.query(`DROP INDEX "IDX_video_progress_material"`);
    await queryRunner.query(`DROP INDEX "IDX_attendances_student_course_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendances_course_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendances_student"`);
    await queryRunner.query(`DROP INDEX "IDX_attendances_course"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TABLE "video_progress"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "attendance_status_enum"`);
    await queryRunner.query(`DROP TYPE "attendance_type_enum"`);

    // Remove columns from course_materials
    await queryRunner.query(`ALTER TABLE "course_materials" DROP COLUMN "attendanceThreshold"`);
    await queryRunner.query(`ALTER TABLE "course_materials" DROP COLUMN "isAttendanceTrigger"`);
  }
}
