import React, { useState } from 'react';
import { MaterialType } from '../../types';
import { GraduationCap } from 'lucide-react';

/**
 * DEBUG COMPONENT - To test attendance trigger form rendering
 * This can be temporarily added to any page to test if the conditional logic works
 */
const AttendanceTriggerDebug: React.FC = () => {
  const [materialType, setMaterialType] = useState<MaterialType>(MaterialType.PDF);
  const [isAttendanceTrigger, setIsAttendanceTrigger] = useState(false);
  const [attendanceThreshold, setAttendanceThreshold] = useState(80);

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm max-w-md">
      <h3 className="font-bold text-lg mb-4">🐛 Attendance Trigger Debug</h3>
      
      {/* Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Material Type:</label>
        <select 
          value={materialType} 
          onChange={(e) => setMaterialType(e.target.value as MaterialType)}
          className="w-full border border-gray-300 rounded-md p-2"
        >
          <option value={MaterialType.PDF}>PDF</option>
          <option value={MaterialType.VIDEO}>Video</option>
          <option value={MaterialType.DOCUMENT}>Document</option>
          <option value={MaterialType.PRESENTATION}>Presentation</option>
          <option value={MaterialType.LINK}>Link</option>
        </select>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <p><strong>Current Type:</strong> {materialType}</p>
        <p><strong>Is Video?:</strong> {materialType === MaterialType.VIDEO ? '✅ YES' : '❌ NO'}</p>
        <p><strong>VIDEO Enum:</strong> {MaterialType.VIDEO}</p>
      </div>

      {/* Conditional Section */}
      {materialType === MaterialType.VIDEO && (
        <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">🎯 Attendance Trigger Found!</h4>
            </div>
            <button
              onClick={() => setIsAttendanceTrigger(!isAttendanceTrigger)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAttendanceTrigger ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAttendanceTrigger ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            ✅ Section ini muncul karena type = VIDEO
          </p>

          {isAttendanceTrigger && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Threshold (%) 📊
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(parseInt(e.target.value) || 80)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="ml-2 text-sm text-gray-600">% untuk absensi</span>
            </div>
          )}
        </div>
      )}

      {materialType !== MaterialType.VIDEO && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ❌ Attendance trigger hidden (not video type)
        </div>
      )}
    </div>
  );
};

export default AttendanceTriggerDebug;