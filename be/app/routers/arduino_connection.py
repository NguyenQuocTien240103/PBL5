# arduino_connection.py
import serial
import serial.tools.list_ports

_arduino_instance = None  # Biến toàn cục giữ kết nối

def find_arduino_port():
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        if 'USB' in p.device or 'ACM' in p.device:
            yield p.device

def auto_connect_arduino(baudrate=9600, timeout=1):
    global _arduino_instance
    if _arduino_instance is not None and _arduino_instance.is_open:
        return _arduino_instance

    for port in find_arduino_port():
        try:
            s = serial.Serial(port, baudrate=baudrate, timeout=timeout)
            _arduino_instance = s
            print(f"✅ Arduino connected at {port}")
            return s
        except serial.SerialException as e:
            print(f"⚠️ Failed to connect to {port}: {e}")

    print("❌ No available Arduino port found.")
    return None

def get_arduino():
    """Hàm để các file khác gọi chung"""
    return auto_connect_arduino()
