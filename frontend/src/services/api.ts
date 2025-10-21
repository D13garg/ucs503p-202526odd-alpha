const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';

export interface Slot {
  id: string;
  subject: string;
  time: string;
  groups: string[];
}

export interface AttendanceRecord {
  date: string;
  slot: string;
  roll_no: string;
  status: string;
  timestamp: string;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
}

export interface SlotsResponse {
  slots: Slot[];
}

export interface SetSlotResponse {
  ok: boolean;
  message: string;
  active: Slot;
}

export interface ActiveSlotResponse {
  active_slot: Slot | null;
}

export interface AttendanceResponse {
  subject: string;
  rows: AttendanceRecord[];
}

export interface EnrollResponse {
  ok: boolean;
  message: string;
  roll_no: string;
}

export interface ScanResponse {
  ok: boolean;
  status?: string;
  roll_no?: string;
  distance?: number;
  message?: string;
}

class ApiClient {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  async login(password: string): Promise<LoginResponse> {
    const res = await fetch(`${this.base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.json();
  }

  async getSlots(): Promise<Slot[]> {
    const res = await fetch(`${this.base}/api/slots`);
    const data: SlotsResponse = await res.json();
    return data.slots;
  }

  async setActiveSlot(slot_id: string, token: string): Promise<SetSlotResponse> {
    const res = await fetch(`${this.base}/api/admin/set_slot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ slot_id })
    });
    return res.json();
  }

  async getActiveSlot(token: string): Promise<ActiveSlotResponse> {
    const res = await fetch(`${this.base}/api/admin/active_slot`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }

  async getAttendance(subject: string, date: string | undefined, token: string): Promise<AttendanceRecord[]> {
    let url = `${this.base}/api/admin/attendance?subject=${encodeURIComponent(subject)}`;
    if (date) {
      url += `&date=${encodeURIComponent(date)}`;
    }
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data: AttendanceResponse = await res.json();
    return data.rows;
  }

  async enroll(roll_no: string): Promise<EnrollResponse> {
    const res = await fetch(`${this.base}/api/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roll_no })
    });
    return res.json();
  }

  async scan(expected_slot_id?: string): Promise<ScanResponse> {
    const body = expected_slot_id ? { expected_slot_id } : {};
    const res = await fetch(`${this.base}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);
