# Attendance System

A facial recognition-based attendance management system with barcode integration.

## Features

- 📷 Face recognition enrollment and verification
- 🔖 Barcode scanning for student identification
- 👨‍💼 Admin dashboard for attendance management
- 📊 Real-time attendance tracking
- 🎯 Slot-based attendance (different subjects/times)

## Tech Stack

**Backend:**
- Python 3.10
- Flask
- OpenCV
- face_recognition library
- pyzbar (barcode scanning)

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```
2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
bashpip install -r requirements.txt
```
4. Create configuration files:
# Create slots.json with your class schedule
# Create groups.json with student group assignments

5. Run the backend:
```bash
python app.py
```

Backend will run on http://127.0.0.1:5000

Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create .env file:

```bash
cp .env.example .env
```

4. Start development server:

```bash 
npm run dev
```

Frontend will run on http://localhost:5173

Usage: 

1. Admin Functions

    Login at /admin/login (default password: adminpass)
    Set active slot for attendance
    View attendance records by subject and date

2. Student Functions

    Enrollment: Go to /student/scan → Enroll → Show barcode + face
    Attendance: Go to /student/scan → Scan → Show barcode + face

3. Debug

    Test all API endpoints at /debug

Important Notes
⚠️ Camera Operations:

    Camera opens on the backend machine, not in the browser
    Ensure backend machine has a connected webcam
    Camera operations block until complete (user shows face or times out)

Project Structure
```bash
attendance-system/
├── backend/
│   ├── app.py                  # Flask API server
│   ├── face_scan.py           # Face enrollment logic
│   ├── barcode_scanner.py     # Barcode + face verification
│   ├── camera_manager.py      # Camera resource management
│   ├── requirements.txt       # Python dependencies
│   ├── slots.json            # Class schedule configuration
│   └── groups.json           # Student group assignments
│
└── frontend/
    ├── src/
    │   ├── services/api.ts    # API client
    │   ├── contexts/         # React contexts
    │   ├── pages/           # Page components
    │   └── components/      # Reusable components
    ├── package.json
    └── README.md
```
API Endpoints
```bash
POST /api/admin/login - Admin authentication
GET /api/slots - Get all time slots
POST /api/admin/set_slot - Set active slot
GET /api/admin/active_slot - Get current active slot
GET /api/admin/attendance - Get attendance records
POST /api/enroll - Enroll student (opens camera)
POST /api/scan - Scan for attendance (opens camera)
```
License
MIT

Save and exit.

## Step 4: Add Files to Git
```bash
# Add all files
git add .

# Check what will be committed
git status

# Make initial commit
git commit -m "Initial commit: Attendance system with face recognition"
```

## **Extra Note: vercel link(deployed)**
```bash
https://attendance-system-ikphh5gbx-mannan-jains-projects.vercel.app
```
*Note: Keep in mind as of now that the camera runs on the backend capturing attendance runs on the local machine
