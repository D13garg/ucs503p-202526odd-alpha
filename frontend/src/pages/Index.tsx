import React from 'react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance System</h1>
        <p className="text-gray-600 mb-8">Facial recognition attendance management</p>
        
        <div className="space-y-4">
          <Link 
            to="/admin/login"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition"
          >
            Admin Login
          </Link>
          
          <Link 
            to="/student/scan"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition"
          >
            Student Scan
          </Link>

          <Link 
            to="/debug"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition"
          >
            Debug Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
