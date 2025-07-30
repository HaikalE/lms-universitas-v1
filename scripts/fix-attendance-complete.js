const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'lms_db',
  user: 'postgres',
  password: 'Facebook.com',
});

const MATERIAL_ID = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

async function fixAttendanceTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting attendance trigger fix...');
    
    // Step 1: Enable attendance trigger for the material
    console.log('\n📹 Step 1: Enabling attendance trigger for video material...');
    const updateMaterial = await client.query(`
      UPDATE course_materials 
      SET 
        "isAttendanceTrigger" = true,
        "attendanceThreshold" = 80,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING id, title, "isAttendanceTrigger", "attendanceThreshold"
    `, [MATERIAL_ID]);
    
    if (updateMaterial.rows.length > 0) {
      console.log('✅ Material updated:', updateMaterial.rows[0]);
    } else {
      console.log('❌ Material not found!');
      return;
    }
    
    // Step 2: Check existing video progress
    console.log('\n📊 Step 2: Checking video progress records...');
    const videoProgress = await client.query(`
      SELECT 
        vp.id,
        vp."studentId",
        vp."isCompleted",
        vp."hasTriggeredAttendance",
        vp."watchedPercentage",
        vp."completedAt",
        cm."courseId",
        u."fullName",
        u."studentId" as student_number
      FROM video_progress vp
      JOIN course_materials cm ON vp."materialId" = cm.id
      JOIN users u ON vp."studentId" = u.id
      WHERE vp."materialId" = $1 AND vp."isCompleted" = true
    `, [MATERIAL_ID]);
    
    console.log(`📈 Found ${videoProgress.rows.length} completed video progress records`);
    videoProgress.rows.forEach(row => {
      console.log(`  - ${row.fullName} (${row.student_number}): ${row.watchedPercentage}% completed`);
    });
    
    // Step 3: Create attendance records for completed videos
    console.log('\n🎯 Step 3: Creating attendance records...');
    
    for (const progress of videoProgress.rows) {
      // Check if attendance already exists
      const existingAttendance = await client.query(`
        SELECT id FROM attendances 
        WHERE "studentId" = $1 
          AND "courseId" = $2 
          AND DATE("attendanceDate") = DATE($3)
      `, [progress.studentId, progress.courseId, progress.completedAt]);
      
      if (existingAttendance.rows.length === 0) {
        // Create new attendance record
        const newAttendance = await client.query(`
          INSERT INTO attendances (
            id,
            "studentId",
            "courseId",
            "triggerMaterialId",
            "attendanceDate",
            status,
            "attendanceType",
            "submittedAt",
            notes,
            metadata,
            "createdAt",
            "updatedAt"
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            DATE($4),
            'auto_present',
            'video_completion',
            $4,
            'Auto-submitted via video completion (100.0%) - Manual Fix',
            '{"videoProgress": 100, "manualFix": true, "completionTime": "' + progress.completedAt.toISOString() + '"}',
            NOW(),
            NOW()
          )
          RETURNING id, "studentId", status, "attendanceDate"
        `, [progress.studentId, progress.courseId, MATERIAL_ID, progress.completedAt]);
        
        console.log(`✅ Created attendance for ${progress.fullName}: ${newAttendance.rows[0].status} on ${newAttendance.rows[0].attendanceDate}`);
      } else {
        console.log(`⚠️  Attendance already exists for ${progress.fullName}`);
      }
      
      // Update video progress to mark as triggered
      await client.query(`
        UPDATE video_progress 
        SET "hasTriggeredAttendance" = true, "updatedAt" = NOW()
        WHERE id = $1
      `, [progress.id]);
    }
    
    // Step 4: Verify final results
    console.log('\n🔍 Step 4: Verifying results...');
    
    const finalAttendance = await client.query(`
      SELECT 
        a.id,
        a."studentId",
        u."fullName",
        u."studentId" as student_number,
        a.status,
        a."attendanceDate",
        a."attendanceType"
      FROM attendances a
      JOIN users u ON a."studentId" = u.id
      WHERE a."triggerMaterialId" = $1
      ORDER BY a."attendanceDate" DESC, u."fullName"
    `, [MATERIAL_ID]);
    
    console.log(`\n📋 Final attendance records (${finalAttendance.rows.length} total):`);
    finalAttendance.rows.forEach(row => {
      console.log(`  - ${row.fullName} (${row.student_number}): ${row.status} on ${row.attendanceDate}`);
    });
    
    // Get updated video progress
    const updatedProgress = await client.query(`
      SELECT "studentId", "isCompleted", "hasTriggeredAttendance", "watchedPercentage"
      FROM video_progress 
      WHERE "materialId" = $1
    `, [MATERIAL_ID]);
    
    console.log(`\n📊 Updated video progress:`);
    updatedProgress.rows.forEach(row => {
      console.log(`  - Student: ${row.studentId}, Completed: ${row.isCompleted}, Triggered: ${row.hasTriggeredAttendance}, Watched: ${row.watchedPercentage}%`);
    });
    
    console.log('\n✅ Attendance trigger fix completed successfully!');
    console.log('\n🎉 Next time students complete videos with isAttendanceTrigger=true, attendance will be automatically created.');
    
  } catch (error) {
    console.error('❌ Error fixing attendance trigger:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixAttendanceTrigger().catch(console.error);