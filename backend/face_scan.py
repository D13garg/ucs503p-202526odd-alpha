#!/usr/bin/env python3
"""
face_scan.py
-------------------------------------
Enroll a student's face by capturing a 128-D embedding using face_recognition.

Usage:
    python face_scan.py

Steps:
    1. Enter 9-digit roll number.
    2. Face is captured via webcam.
    3. Embedding is stored in face_data.json.

Date: 2025-10-09
"""

import cv2
import face_recognition
import json
import os
os.environ['QT_QPA_PLATFORM'] = 'xcb'  # Force X11
os.environ.pop('WAYLAND_DISPLAY', None)  # Disable Wayland
import time
from datetime import datetime
from colorama import Fore, Style
from camera_manager import camera_manager

DATA_FILE = "face_data.json"



def capture_face_embedding(timeout=30) -> list | None:
    """
    Capture a single face embedding from the webcam.
    """
    cap = None
    try:
        cap = camera_manager.acquire_camera()

        if cap is None:
            print(Fore.RED + "❌ ERROR: Camera not accessible." + Style.RESET_ALL)
            return None

        print(Fore.CYAN + "Press 'q' when your face is visible and centered..." + Style.RESET_ALL)
        print(Fore.YELLOW + f"⏱ Timeout in {timeout} seconds if no face captured" + Style.RESET_ALL)

        embedding = None
        start_time = time.time()
        
        while True:
            if time.time() - start_time > timeout:
                print(Fore.YELLOW + "\n⏱ Timeout reached. No face captured." + Style.RESET_ALL)
                break

            ret, frame = cap.read()
            if not ret:
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_frame)

            if face_locations:
                top, right, bottom, left = face_locations[0]
                embeddings = face_recognition.face_encodings(rgb_frame, [face_locations[0]])

                if embeddings:
                    embedding = embeddings[0]
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                    cv2.putText(frame, "Face Detected - Press Q", (left, top - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            cv2.imshow("Face Enrollment", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:
                break

    except KeyboardInterrupt:
        print(Fore.YELLOW + "\n⚠ Interrupted by user." + Style.RESET_ALL)

    except Exception as e:
        print(Fore.RED + f"❌ Error during capture: {str(e)}" + Style.RESET_ALL)

    finally:
        camera_manager.release_camera(cap)

    return embedding.tolist() if embedding is not None else None


def load_face_database() -> dict:
    """Load the existing face database safely from JSON."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            print(Fore.YELLOW + "⚠ Warning: face_data.json is empty or corrupt. Reinitializing." + Style.RESET_ALL)
            return {}
    return {}


def save_face_database(face_db: dict) -> None:
    """Save updated face database with indentation and sorted keys."""
    with open(DATA_FILE, "w") as f:
        json.dump(face_db, f, indent=2, sort_keys=True)


def enroll_student(roll_no: str, timeout=30) -> bool:
    """
    Capture and store a student's face embedding linked to roll number.
    Returns True if successful, False otherwise.
    """
    print(Fore.CYAN + f"Enrolling student {roll_no}..." + Style.RESET_ALL)

    embedding = capture_face_embedding(timeout=timeout)
    if not embedding:
        print(Fore.RED + "❌ No face embedding captured. Try again." + Style.RESET_ALL)
        return False

    face_db = load_face_database()
    face_db[roll_no] = embedding
    save_face_database(face_db)
    
    print(Fore.GREEN + f"✅ Enrollment complete for roll {roll_no}." + Style.RESET_ALL)
    return True


def enroll_student_api(roll_no: str) -> dict:
    """
    API-friendly wrapper: enroll and return JSON-serializable result.
    Includes proper timeout and error handling.
    """
    try:
        success = enroll_student(roll_no, timeout=30)
        
        if success:
            # Verify enrollment
            face_db = load_face_database()
            if roll_no in face_db:
                return {
                    "ok": True, 
                    "message": f"✅ Enrollment complete for {roll_no}", 
                    "roll_no": roll_no
                }
        
        return {
            "ok": False, 
            "message": "No face captured. Please try again.", 
            "roll_no": roll_no
        }
        
    except Exception as e:
        return {
            "ok": False, 
            "message": f"Enrollment failed: {str(e)}", 
            "roll_no": roll_no
        }


def main() -> None:
    """Main entry point for face enrollment."""
    roll_no = input("Enter roll number (9 digits): ").strip()

    if len(roll_no) == 9 and roll_no.isdigit():
        enroll_student(roll_no)
    else:
        print(Fore.RED + "❌ Invalid roll number format. Must be 9 digits." + Style.RESET_ALL)


if __name__ == "__main__":
    main()