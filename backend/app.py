# backend/app.py
from flask import Flask, jsonify, request
import os, json, csv, uuid
from datetime import datetime
from pathlib import Path
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
  # allow only your frontend


# Import helper functions from your modules
# note: make sure face_scan.py defines enroll_student_api(roll_no) as shown earlier
from face_scan import enroll_student_api
from barcode_scanner import scan_once

BASE_DIR = Path(__file__).resolve().parent
SLOTS_FILE = BASE_DIR / "slots.json"
GROUPS_FILE = "groups.json"

if os.path.exists(GROUPS_FILE):
    with open(GROUPS_FILE, "r") as f:
        GROUPS_TO_ROLLS = json.load(f)
else:
    GROUPS_TO_ROLLS = {}

ATT_DIR = BASE_DIR / "subject_attendance"
ATT_DIR.mkdir(parents=True, exist_ok=True)

# Simple in-memory admin sessions (prototype)
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "adminpass")  # set env var for real use
admin_sessions = {}  # token -> timestamp

# Active slot (store id and metadata)
active_slot = None

def load_slots():
    if SLOTS_FILE.exists():
        return json.loads(SLOTS_FILE.read_text())
    return {"slots": []}

def find_slot_by_id(slot_id):
    slots = load_slots().get("slots", [])
    for s in slots:
        if s["id"] == slot_id:
            return s
    return None

def append_attendance(subject, date, slot_time, roll_no, status):
    """Append row to subject CSV in subject_attendance directory."""
    fname = ATT_DIR / f"{subject}.csv"
    header = ["date", "slot", "roll_no", "status", "timestamp"]
    row = [date, slot_time, roll_no, status, datetime.now().isoformat()]
    file_exists = fname.exists()
    with open(fname, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(header)
        writer.writerow(row)

@app.route("/")
def home():
    return jsonify({"message": "Attendance backend running"})

@app.route("/api/slots", methods=["GET"])
def api_slots():
    return jsonify(load_slots())

@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    body = request.get_json(force=True) or {}
    password = body.get("password")
    if password != ADMIN_PASSWORD:
        return jsonify({"ok": False, "message": "Invalid password"}), 401
    token = str(uuid.uuid4())
    admin_sessions[token] = datetime.utcnow().isoformat()
    return jsonify({"ok": True, "token": token})

def check_token(req):
    auth = req.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        return token if token in admin_sessions else None
    return None

@app.route("/api/admin/active_slot", methods=["GET"])
def api_get_active_slot():
    token = check_token(request)
    if not token:
        return jsonify({"ok": False, "message": "Unauthorized"}), 401
    return jsonify({"active_slot": active_slot})


@app.route("/api/admin/set_slot", methods=["POST"])
def api_set_slot():
    token = check_token(request)
    if not token:
        return jsonify({"ok": False, "message": "Unauthorized"}), 401
    body = request.get_json(force=True) or {}
    slot_id = body.get("slot_id")
    slot = find_slot_by_id(slot_id)
    if not slot:
        return jsonify({"ok": False, "message": "Slot not found"}), 404
    global active_slot
    active_slot = slot
    return jsonify({"ok": True, "message": "Active slot set", "active": slot})

@app.route("/api/admin/attendance", methods=["GET"])
def api_admin_attendance():
    token = check_token(request)
    if not token:
        return jsonify({"ok": False, "message": "Unauthorized"}), 401
    subject = request.args.get("subject")
    date = request.args.get("date")  # optional filter
    if not subject:
        return jsonify({"ok": False, "message": "subject query param required"}), 400
    fname = ATT_DIR / f"{subject}.csv"
    if not fname.exists():
        return jsonify({"subject": subject, "rows": []})
    rows = []
    with open(fname, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if date and r["date"] != date:
                continue
            rows.append(r)
    return jsonify({"subject": subject, "rows": rows})

@app.route("/api/enroll", methods=["POST"])
def api_enroll():
    body = request.get_json(force=True) or {}
    roll_no = body.get("roll_no")
    if not roll_no:
        return jsonify({"ok": False, "message": "roll_no required"}), 400
    # This will open camera on the machine where Flask runs — intended for local demo
    result = enroll_student_api(roll_no)
    return jsonify(result)

@app.route("/api/scan", methods=["POST"])
def api_scan():
    # Optionally expected_slot_id can be provided; otherwise use active_slot
    body = request.get_json(force=True) or {}
    expected_slot_id = body.get("expected_slot_id")
    slot = None
    if expected_slot_id:
        slot = find_slot_by_id(expected_slot_id)
    else:
        slot = active_slot

    if not slot:
        return jsonify({"ok": False, "message": "No active slot"}), 400

    # For security: load expected students list if you keep it somewhere (optional)
    # For prototype, assume slot entry contains "students": [rolls...]
    expected_students = slot.get("students") if "students" in slot else None

    # Run the blocking scanner function (opens camera)
    scan_result = scan_once(expected_students=expected_students, timeout=60)

    # If we have a roll_no and subject, append to attendance
    # Check if roll_no is allowed in this slot
    roll_no = None
    if "roll_no" in scan_result:
        roll_no = scan_result["roll_no"]

        # Step 1: check if roll_no exists in face_data.json (already handled by scan_once)
        if roll_no not in scan_result.get("ok_rolls", [roll_no]):
            scan_result["ok"] = False
            scan_result["status"] = "NOT_ENROLLED"
        else:
            # Step 2: find which group this student belongs to
            student_group = None
            for group, rolls in GROUPS_TO_ROLLS.items():
                if roll_no in rolls:
                    student_group = group
                    break

            if not student_group:
                scan_result["ok"] = False
                scan_result["status"] = "NO_GROUP"
            else:
                # Step 3: check if student_group is in active_slot.groups
                if student_group not in slot.get("groups", []):
                    scan_result["ok"] = False
                    scan_result["status"] = "NOT_IN_ACTIVE_GROUP"

    # Save attendance only for valid or failed scans (keeps logs)
    if "roll_no" in scan_result and slot:
        date_str = datetime.now().strftime("%Y-%m-%d")
        append_attendance(
            slot["subject"],
            date_str,
            slot["time"],
            scan_result.get("roll_no"),
            scan_result.get("status")
        )
    return jsonify(scan_result)

if __name__ == "__main__":
    # development server — run with python app.py
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=False)
