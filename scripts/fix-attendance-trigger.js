const { execSync } = require('child_process');

// Material ID from the provided data
const materialId = 'e2915fc2-9345-4188-a6ba-484e7294ee42';

console.log('🔧 Fixing attendance trigger for video material...');
console.log(`📹 Material ID: ${materialId}`);

try {
  // Make API call to update the material and enable attendance trigger
  const updateCommand = `curl -X PATCH "http://localhost:3001/api/courses/materials/${materialId}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -d '{
      "isAttendanceTrigger": true,
      "attendanceThreshold": 80
    }'`;

  console.log('\n🚀 API Command to run:');
  console.log(updateCommand);
  
  console.log('\n📝 Manual SQL fix (run in database):');
  console.log(`UPDATE course_materials SET "isAttendanceTrigger" = true, "attendanceThreshold" = 80 WHERE id = '${materialId}';`);
  
  console.log('\n✅ After updating, the video completion should trigger attendance!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}