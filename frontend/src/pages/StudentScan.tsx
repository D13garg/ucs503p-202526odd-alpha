import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ScanResponse } from '../services/api';

const StudentScan = () => {
  const navigate = useNavigate();
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const handleEnroll = async () => {
    if (!rollNo.trim()) {
      setResult('Please enter roll number');
      return;
    }
    setLoading(true);
    setResult('Opening camera on backend... Please show barcode and face.');
    try {
      const response = await api.enroll(rollNo);
      if (response.ok) {
        setResult(`✅ ${response.message}`);
      } else {
        setResult(`❌ ${response.message}`);
      }
    } catch (err) {
      setResult('❌ Enrollment failed. Check backend is running.');
    } finally {
      setLoading(false);
      setShowEnrollModal(false);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setResult('Opening camera on backend... Please show your face.');
    try {
      const response: ScanResponse = await api.scan();
      if (response.ok && response.status === 'VALID') {
        setResult(`✅ Attendance marked for ${response.roll_no}`);
      } else {
        setResult(`❌ Scan failed: ${response.status || response.message || 'Unknown error'}`);
      }
    } catch (err) {
      setResult('❌ Scan failed. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Portal</h1>
        <p className="text-gray-600 mb-6">Enroll or scan for attendance</p>

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-semibold">⚠️ Important:</p>
          <p className="text-yellow-700 text-sm">
            These actions will open the camera on the machine running the Flask backend. 
            Make sure the backend is running locally on that machine with a connected webcam.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowEnrollModal(true)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg text-lg transition"
          >
            📷 Enroll New Student
          </button>

          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 px-6 rounded-lg text-lg transition"
          >
            {loading ? '⏳ Processing...' : '✅ Scan for Attendance'}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800' : result.startsWith('❌') ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
            {result}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to Home
        </button>
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Enroll Student</h2>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter roll number (e.g., 102303593)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              disabled={loading}
            />
            <div className="flex gap-3">
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg"
              >
                {loading ? 'Enrolling...' : 'Start Enrollment'}
              </button>
              <button
                onClick={() => setShowEnrollModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentScan;