import React from 'react';
import { AttendanceRecord } from '../services/api';

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'VALID':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'FACE_MISMATCH':
    case 'INVALID':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'NO_FACE':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'NOT_IN_ACTIVE_GROUP':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left border">Date</th>
            <th className="px-4 py-2 text-left border">Slot</th>
            <th className="px-4 py-2 text-left border">Roll No</th>
            <th className="px-4 py-2 text-left border">Status</th>
            <th className="px-4 py-2 text-left border">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{record.date}</td>
              <td className="px-4 py-2 border">{record.slot}</td>
              <td className="px-4 py-2 border font-mono">{record.roll_no}</td>
              <td className="px-4 py-2 border">
                <span className={`px-2 py-1 rounded border text-sm font-semibold ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </td>
              <td className="px-4 py-2 border text-sm">{record.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && (
        <div className="text-center py-8 text-gray-500">No attendance records found</div>
      )}
    </div>
  );
};

export default AttendanceTable;
