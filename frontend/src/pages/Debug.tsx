import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Debug = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [mockScan, setMockScan] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runTests = async () => {
    setRunning(true);
    setLogs([]);

    try {
      addLog('🔐 Step 1: Admin Login...');
      const loginRes = await api.login('adminpass');
      addLog(`Request: POST /api/admin/login { password: "adminpass" }`);
      addLog(`Response: ${JSON.stringify(loginRes)}`);
      if (!loginRes.ok) {
        addLog('❌ Login failed');
        setRunning(false);
        return;
      }
      const token = loginRes.token;
      addLog('✅ Login successful');

      addLog('\n📋 Step 2: Get Slots...');
      const slots = await api.getSlots();
      addLog(`Request: GET /api/slots`);
      addLog(`Response: ${JSON.stringify(slots)}`);
      addLog(`✅ Loaded ${slots.length} slots`);

      if (slots.length === 0) {
        addLog('⚠️ No slots available');
        setRunning(false);
        return;
      }

      addLog('\n🎯 Step 3: Set Active Slot...');
      const firstSlot = slots[0];
      const setSlotRes = await api.setActiveSlot(firstSlot.id, token);
      addLog(`Request: POST /api/admin/set_slot { slot_id: "${firstSlot.id}" }`);
      addLog(`Response: ${JSON.stringify(setSlotRes)}`);
      addLog(`✅ Set active slot: ${firstSlot.subject}`);

      addLog('\n🔍 Step 4: Get Active Slot...');
      const activeRes = await api.getActiveSlot(token);
      addLog(`Request: GET /api/admin/active_slot`);
      addLog(`Response: ${JSON.stringify(activeRes)}`);
      addLog('✅ Active slot retrieved');

      if (mockScan) {
        addLog('\n📸 Step 5: Mock Scan (simulated)...');
        addLog('Mock response: { ok: true, status: "VALID", roll_no: "102303593", distance: 0.31 }');
        addLog('✅ Mock scan successful');
      } else {
        addLog('\n📸 Step 5: Real Scan...');
        addLog('⚠️ This will open camera on backend. Waiting...');
        const scanRes = await api.scan(firstSlot.id);
        addLog(`Request: POST /api/scan { expected_slot_id: "${firstSlot.id}" }`);
        addLog(`Response: ${JSON.stringify(scanRes)}`);
        if (scanRes.ok) {
          addLog('✅ Scan successful');
        } else {
          addLog(`⚠️ Scan failed: ${scanRes.status}`);
        }
      }

      addLog('\n📊 Step 6: Get Attendance...');
      const attendanceRes = await api.getAttendance(firstSlot.subject, undefined, token);
      addLog(`Request: GET /api/admin/attendance?subject=${firstSlot.subject}`);
      addLog(`Response: ${attendanceRes.length} records`);
      addLog('✅ Attendance retrieved');

      addLog('\n🎉 All tests completed!');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Debug Test Sequence</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={runTests}
              disabled={running}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {running ? '⏳ Running Tests...' : '▶️ Run Test Sequence'}
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mockScan}
                onChange={(e) => setMockScan(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Mock Scan (skip camera)</span>
            </label>
          </div>
          <p className="text-sm text-gray-400">
            This will test: login → getSlots → setActiveSlot → getActiveSlot → scan → getAttendance
          </p>
        </div>

        <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click "Run Test Sequence" to begin.</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1 whitespace-pre-wrap">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Debug;