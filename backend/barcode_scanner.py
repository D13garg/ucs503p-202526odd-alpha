#!/usr/bin/env python3
"""
barcode_scanner.py

Provides a scan_once(...) function that will:
- open webcam
- wait for first barcode detection (or timeout)
- run face verification against stored face_data.json
- return a dict with status and roll_no
"""

import cv2
from pyzbar.pyzbar import decode
import re
import time
import json
import os
os.environ['QT_QPA_PLATFORM'] = 'xcb'  # Force X11
os.environ.pop('WAYLAND_DISPLAY', None)  # Disable Wayland
import numpy as np
import face_recognition
from datetime import datetime
from camera_manager import camera_manager

# === Config ===
CAM_INDEX = 0
ROLL_REGEX = re.compile(r'^\d{9}$')
DB_FILE = "face_data.json"
SIMILARITY_THRESHOLD = 0.4
DUPLICATE_COOLDOWN = 1.0  # in seconds for internal debounce
# ============

# Load face DB (will re-load each scan)
def load_face_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}



def scan_once(expected_students: list = None, timeout: int = 30):
    """
    Open camera and wait for a barcode. When barcode is detected, attempt face match.
    """
    start = time.time()
    cap = None
    window_name = "Attendance Scanner - Show Barcode + Face"
    
    try:
        cap = camera_manager.acquire_camera()
        
        if cap is None:
            return {"ok": False, "status": "CAMERA_ERROR", "message": "Cannot open camera"}

        # Create window explicitly
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL | cv2.WINDOW_KEEPRATIO)
        cv2.waitKey(1)
        
        last_seen = {}
        print(f"📸 Camera opened. Waiting for barcode... (timeout: {timeout}s)")
        
        while True:
            elapsed = time.time() - start
            if elapsed > timeout:
                print(f"⏱ Timeout after {elapsed:.1f}s")
                return {"ok": False, "status": "TIMEOUT", "message": "No barcode detected within timeout"}

            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            barcodes = decode(frame)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb)
            face_encodings = face_recognition.face_encodings(rgb, face_locations)

            status_text = f"Time: {int(elapsed)}s | Faces: {len(face_encodings)} | Barcodes: {len(barcodes)}"
            cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(frame, "Press Q or ESC to cancel", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            for barcode in barcodes:
                raw = barcode.data.decode('utf-8').strip()
                print(f"🔍 Barcode detected: {raw}")
                
                if not ROLL_REGEX.match(raw):
                    print(f"❌ Invalid format: {raw}")
                    return {"ok": False, "status": "INVALID_FORMAT", "roll_no": raw}

                last = last_seen.get(raw)
                now = time.time()
                if last and (now - last) < DUPLICATE_COOLDOWN:
                    continue
                last_seen[raw] = now

                if expected_students is not None and raw not in expected_students:
                    print(f"⚠️ Student {raw} not in expected list")
                    return {"ok": False, "status": "NOT_PART_OF_CLASS", "roll_no": raw}

                face_db = load_face_db()
                if raw not in face_db:
                    print(f"❌ No enrollment record for {raw}")
                    return {"ok": False, "status": "NO_RECORD", "roll_no": raw}

                if not face_encodings:
                    print(f"❌ No face detected for {raw}")
                    return {"ok": False, "status": "NO_FACE", "roll_no": raw}

                stored_embedding = np.array(face_db[raw])
                live_embedding = face_encodings[0]
                dist = face_recognition.face_distance([stored_embedding], live_embedding)[0]

                print(f"📊 Face distance: {dist:.3f} (threshold: {SIMILARITY_THRESHOLD})")

                if dist < SIMILARITY_THRESHOLD:
                    print(f"✅ Valid attendance for {raw}")
                    return {"ok": True, "status": "VALID", "roll_no": raw, "distance": float(dist)}
                else:
                    print(f"❌ Face mismatch for {raw}")
                    return {"ok": False, "status": "FACE_MISMATCH", "roll_no": raw, "distance": float(dist)}

            # Show frame with explicit window name
            cv2.imshow(window_name, frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:
                print("⚠️ Scan cancelled by user")
                return {"ok": False, "status": "ABORTED_BY_USER"}
                
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted by user")
        return {"ok": False, "status": "INTERRUPTED"}
        
    except Exception as e:
        print(f"❌ Error during scan: {str(e)}")
        return {"ok": False, "status": "ERROR", "message": str(e)}
        
    finally:
        # Destroy the specific window
        try:
            cv2.destroyWindow(window_name)
        except:
            pass
        camera_manager.release_camera(cap)

        
if __name__ == "__main__":
    print("Running standalone scanner: will wait for one barcode then exit.")
    result = scan_once(timeout=60)
    print(result)