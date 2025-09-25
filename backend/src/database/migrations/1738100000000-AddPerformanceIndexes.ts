import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1738100000000 implements MigrationInterface {
    name = 'AddPerformanceIndexes1738100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🚀 Creating performance indexes for LMS...');

        // 1. Users table indexes
        console.log('📇 Creating users indexes...');
        
        // Index on email for login queries (if not exists already)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_email" 
            ON "users" ("email")
        `);
        
        // Index on role for role-based queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_role" 
            ON "users" ("role")
        `);

        // Index on isActive for filtering active users
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_active" 
            ON "users" ("isActive")
        `);

        console.log('✅ Users indexes created');

        // 2. Courses table indexes
        console.log('📚 Creating courses indexes...');
        
        // Index on code for course lookup
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_courses_code" 
            ON "courses" ("code")
        `);
        
        // Index on lecturerId for lecturer's courses
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_courses_lecturer" 
            ON "courses" ("lecturerId")
        `);

        // Index on semester for semester-based queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_courses_semester" 
            ON "courses" ("semester")
        `);

        // Index on isActive for active courses
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_courses_active" 
            ON "courses" ("isActive")
        `);

        console.log('✅ Courses indexes created');

        // 3. Course enrollments table indexes (if table exists)
        console.log('👥 Creating course_enrollments indexes...');
        
        // Check if course_enrollments table exists
        const courseEnrollmentsExists = await queryRunner.hasTable("course_enrollments");
        
        if (courseEnrollmentsExists) {
            // Unique index on courseId + userId (prevent duplicate enrollments)
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "idx_course_enrollments_unique" 
                ON "course_enrollments" ("courseId", "userId")
            `);
            
            // Index on courseId for course's students
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_course_enrollments_course" 
                ON "course_enrollments" ("courseId")
            `);
            
            // Index on userId for user's courses
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_course_enrollments_user" 
                ON "course_enrollments" ("userId")
            `);
            
            console.log('✅ Course enrollments indexes created');
        } else {
            console.log('⚠️ course_enrollments table not found, skipping its indexes');
        }

        // 4. Forum posts table indexes
        console.log('💬 Creating forum_posts indexes...');
        
        // Index on courseId for course forums
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_forum_posts_course" 
            ON "forum_posts" ("courseId")
        `);
        
        // Index on courseId + createdAt for chronological course posts
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_forum_posts_course_created" 
            ON "forum_posts" ("courseId", "createdAt")
        `);

        // Index on authorId for user's posts
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_forum_posts_author" 
            ON "forum_posts" ("authorId")
        `);

        // Index on parentId for replies
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_forum_posts_parent" 
            ON "forum_posts" ("parentId")
        `);

        console.log('✅ Forum posts indexes created');

        // 5. Additional useful indexes
        console.log('⚡ Creating additional performance indexes...');

        // Assignments table indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_assignments_course" 
            ON "assignments" ("courseId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_assignments_due_date" 
            ON "assignments" ("dueDate")
        `);

        // Course materials indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_course_materials_course" 
            ON "course_materials" ("courseId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_course_materials_week" 
            ON "course_materials" ("week")
        `);

        console.log('✅ Additional indexes created');
        console.log('🎉 All performance indexes created successfully!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Removing performance indexes...');

        // Remove users indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_active"`);

        // Remove courses indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_courses_code"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_courses_lecturer"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_courses_semester"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_courses_active"`);

        // Remove course enrollments indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_enrollments_unique"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_enrollments_course"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_enrollments_user"`);

        // Remove forum posts indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_forum_posts_course"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_forum_posts_course_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_forum_posts_author"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_forum_posts_parent"`);

        // Remove additional indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_assignments_course"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_assignments_due_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_materials_course"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_materials_week"`);

        console.log('✅ Performance indexes removed');
    }
}