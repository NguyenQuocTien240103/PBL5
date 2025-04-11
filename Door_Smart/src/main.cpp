#include <Arduino.h>
#include <Stepper.h>

const int stepsPerRevolution = 2048; // Số bước cho 1 vòng quay
Stepper myStepper(stepsPerRevolution, 8, 10, 9, 11);

void setup() {
    Serial.begin(9600); // Khởi tạo giao tiếp serial
    myStepper.setSpeed(15); // Tốc độ quay (RPM)
}

void loop() {
    if (Serial.available() > 0) { // Kiểm tra nếu có dữ liệu từ Python
        char command = Serial.read(); // Đọc lệnh từ Python
        if (command == '1') { // Nếu nhận được tín hiệu '1' (phát hiện con người)
            Serial.println("Phát hiện con người, quay 2 vòng...");
            for (int i = 0; i < 2; i++) { // Quay 2 vòng
                myStepper.step(stepsPerRevolution); // Quay 1 vòng
                delay(1000); // Dừng 1 giây giữa các vòng
            }
            Serial.println("Hoàn thành quay 2 vòng.");
            while (true); // Dừng chương trình
        } else if (command == '0') { // Nếu nhận được tín hiệu '0' (không phát hiện con người)
            Serial.println("Không phát hiện con người, không quay.");
        }else {
          Serial.println("Không có tín hiệu hợp lệ.");
        }
    }
}