#!/usr/bin/env python3
"""
camera_manager.py
Centralized camera management with proper cleanup and mutex locking
"""

import cv2
import time
import threading
import subprocess
import os

class CameraManager:
    """Singleton camera manager to ensure only one camera access at a time"""
    _instance = None
    _lock = threading.Lock()
    _camera_lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def force_release_camera_device(self):
        """Force release camera device at OS level"""
        try:
            # Kill any hanging processes using the camera
            subprocess.run(['fuser', '-k', '/dev/video0'], 
                         stderr=subprocess.DEVNULL, 
                         stdout=subprocess.DEVNULL)
            time.sleep(0.5)
        except:
            pass
    
    def acquire_camera(self, cam_index=0, max_retries=5):
        """
        Acquire camera with retry logic and proper locking
        Returns: VideoCapture object or None
        """
        with self._camera_lock:
            # Destroy any lingering windows first
            cv2.destroyAllWindows()
            cv2.waitKey(1)
            
            cap = None
            for attempt in range(max_retries):
                try:
                    if attempt > 0:
                        print(f"⚠️ Camera retry {attempt}/{max_retries}...")
                        time.sleep(2)
                        # Force release on retry
                        self.force_release_camera_device()
                    
                    # Try multiple backends
                    backends = [cv2.CAP_V4L2, cv2.CAP_ANY]
                    
                    for backend in backends:
                        cap = cv2.VideoCapture(cam_index, backend)
                        
                        if cap.isOpened():
                            # Set buffer size to 1 for lower latency
                            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                            
                            # Test read
                            ret, frame = cap.read()
                            if ret:
                                print(f"✅ Camera acquired successfully (backend: {backend})")
                                
                                # Pre-create window to ensure it's ready
                                cv2.namedWindow("Camera", cv2.WINDOW_NORMAL | cv2.WINDOW_KEEPRATIO)
                                cv2.waitKey(1)
                                
                                return cap
                            else:
                                cap.release()
                                cap = None
                        else:
                            if cap:
                                cap.release()
                            cap = None
                        
                except Exception as e:
                    print(f"❌ Camera error on attempt {attempt}: {e}")
                    if cap:
                        try:
                            cap.release()
                        except:
                            pass
                    cap = None
            
            print(f"❌ Failed to acquire camera after {max_retries} attempts")
            return None
    
    def release_camera(self, cap):
        """
        Properly release camera with extra cleanup
        """
        if cap is not None:
            try:
                # Release capture
                cap.release()
                
                # Destroy all windows multiple times
                for _ in range(3):
                    cv2.destroyAllWindows()
                    cv2.waitKey(1)
                
                # Extra delay
                time.sleep(0.8)
                
                print("📷 Camera released")
            except Exception as e:
                print(f"⚠️ Error releasing camera: {e}")
            finally:
                # Final cleanup
                try:
                    cv2.destroyAllWindows()
                except:
                    pass

# Global instance
camera_manager = CameraManager()