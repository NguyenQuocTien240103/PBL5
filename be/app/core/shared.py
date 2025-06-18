from picamera2 import Picamera2
import threading

picam2 = Picamera2()
config = picam2.create_video_configuration(main={"size": (640, 480), "format": "RGB888"})
picam2.configure(config)
picam2.start()

camera_active = False
lock = threading.Lock()
