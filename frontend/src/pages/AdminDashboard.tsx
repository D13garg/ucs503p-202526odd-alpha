import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, Slot, AttendanceRecord } from '../services/api';
import SlotPicker from '../components/SlotPicker';
import AttendanceTable from '../components/AttendanceTable';

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadSlots();
    loadActiveSlot();
  }, [token]);

  const loadSlots = async () => {
    try {
      const data = await api.getSlots();
      setSlots(data);
    } catch (err) {
      setMessage('Failed to load slots');
    }
  };

  const loadActiveSlot = async () => {
    if (!token) return;
    try {
      const data = await api.getActiveSlot(token);
      setActiveSlot(data.active_slot);
    } catch (err) {
      console.error('Failed to load active slot');
    }
  };

  const handleSetSlot = async () => {
    if (!selectedSlot || !token) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await api.setActiveSlot(selectedSlot, token);
      if (response.ok) {
        setMessage(`✅ ${response.message}`);
        setActiveSlot(response.active);
      } else {
        setMessage('Failed to set slot');
      }
    } catch (err) {
      setMessage('Error setting slot');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = async () => {
    if (!attendanceSubject || !token) return;
    setLoadingAttendance(true);
    try {
      const records = await api.getAttendance(attendanceSubject, attendanceDate || undefined, token);
      setAttendanceRecords(records);
    } catch (err) {
      setMessage('Failed to load attendance');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const subjects = Array.from(new Set(slots.map(s => s.subject)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Set Active Slot</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <SlotPicker 
                slots={slots} 
                value={selectedSlot} 
                onChange={setSelectedSlot} 
              />
            </div>
            <button
              onClick={handleSetSlot}
              disabled={loading || !selectedSlot}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg"
            >
              {loading ? 'Setting...' : 'Set Active Slot'}
            </button>
          </div>
        </div>

        {activeSlot && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800">Current Active Slot:</h3>
            <p className="text-green-700">
              {activeSlot.subject} · {activeSlot.time} · Groups: {activeSlot.groups.join(', ')}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">View Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={attendanceSubject}
                onChange={(e) => setAttendanceSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date (optional)</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleViewAttendance}
                disabled={loadingAttendance || !attendanceSubject}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg"
              >
                {loadingAttendance ? 'Loading...' : 'View Attendance'}
              </button>
            </div>
          </div>

          {attendanceRecords.length > 0 && (
            <AttendanceTable records={attendanceRecords} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
