#include <Arduino.h>
#include <IRremote.hpp>

// Chân điều khiển mô tơ bước
#define STEPPER_PIN_1 9
#define STEPPER_PIN_2 10
#define STEPPER_PIN_3 11
#define STEPPER_PIN_4 12

// Chân điều khiển cửa trượt
#define IN1 7
#define IN2 6

// Chân IR receiver
#define IR_RECEIVE_PIN 2

// Chân LED và buzzer
#define LED_PIN 3
#define BUZZER_PIN 4

// Cấu hình
const int steps_per_revolution = 2048;
const int step_075_round = int(steps_per_revolution * 0.75);
int step_number = 0;
unsigned long lastTime = millis();
bool flag_run_stepper = false;
int count_mo_cua = 0; // Biến đếm trạng thái cửa (0: đóng, 1: đã mở)

void OneStep(bool dir);
void runStepper(bool dir, int steps);
void moCua();
void dongCua();

void setup() {
  // Khởi tạo chân I/O
  pinMode(STEPPER_PIN_1, OUTPUT);
  pinMode(STEPPER_PIN_2, OUTPUT);
  pinMode(STEPPER_PIN_3, OUTPUT);
  pinMode(STEPPER_PIN_4, OUTPUT);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);
  Serial.println("Arduino sẵn sàng. Gửi '1' để quay mô tơ, '2' để mở cửa, '3' để đóng cửa, '4' khi phát hiện người, '9' quay ngược.");

  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
}

void loop() {
  // Nhận lệnh qua Serial
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    Serial.print("Nhận lệnh: ");
    Serial.println(command);

    if (command == "1") {
      if (count_mo_cua == 0) {
        Serial.println("Đang quay mô tơ 0.75 vòng...");
        runStepper(true, step_075_round);
        Serial.println("Đã quay xong.");
        count_mo_cua = 1;
      } else {
        Serial.println("Cửa đang mở, không thể mở tiếp!");
      }
    } else if (command == "2") {
      Serial.println("🎤 Giọng nói: MỞ CỬA");
      moCua();
      
    } else if (command == "3") {
      Serial.println("🎤 Giọng nói: ĐÓNG CỬA");
      dongCua();
      
    } else if (command == "4") {
      Serial.println("🔍 Phát hiện người!");
      digitalWrite(LED_PIN, HIGH);
      tone(BUZZER_PIN, 1000, 200);
    } else if (command == "5") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("Đèn BẬT");
    } else if (command == "6") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("Đèn TẮT");
    } else if (command == "7") {
      digitalWrite(LED_PIN, HIGH);
      tone(BUZZER_PIN, 1000, 200);
      Serial.println("Báo động BẬT");
    } else if (command == "8") {
      noTone(BUZZER_PIN);
      digitalWrite(LED_PIN, LOW);
      Serial.println("Báo động TẮT");
    } else if (command == "9") {
      Serial.println("Đang quay mô tơ NGƯỢC 0.75 vòng...");
      runStepper(false, step_075_round);
      count_mo_cua = 0; // Đóng cửa xong cho phép mở lại
      Serial.println("Đã quay xong.");
    } else if (command == "10") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("Đèn BẬT (không buzzer)");
    } else {
      Serial.println("Lệnh không hợp lệ.");
    }
  }

  // Nhận tín hiệu IR
  if (IrReceiver.decode()) {
    uint32_t code = IrReceiver.decodedIRData.decodedRawData;
    if (code && millis() - lastTime > 250) {
      switch (code) {
        case 3125149440: dongCua(); count_mo_cua = 0; break;  // Nút 1
        case 3108437760:
          if (count_mo_cua == 0) {
            moCua();
            count_mo_cua = 1;
          } else {
            Serial.println("Cửa đang mở, không thể mở tiếp!");
          }
          break;
        case 3091726080:
          if (count_mo_cua == 0) {
            runStepper(true, step_075_round);
            count_mo_cua = 1;
          } else {
            Serial.println("Cửa đang mở, không thể mở tiếp!");
          }
          break;
        case 3141861120: 
          digitalWrite(LED_PIN, !digitalRead(LED_PIN)); 
          break; // Nút 4
        case 4161273600: 
          digitalWrite(LED_PIN, LOW); 
          break;   // Nút 7
        case 3927310080: 
          digitalWrite(LED_PIN, HIGH); 
          break;  // Nút 8
        case 3208707840: 
          runStepper(false, step_075_round);  
          break; // Nút 5: Quay ngược
      }
      lastTime = millis();
    }
    IrReceiver.resume();
  }
}

// Hàm quay mô tơ nhiều bước
void runStepper(bool dir, int steps) {
  for (int i = 0; i < steps; i++) {
    OneStep(dir);
    delay(5);
  }
}

// Hàm quay một bước
void OneStep(bool dir) {
  if (dir) step_number++;
  else step_number--;

  if (step_number > 3) step_number = 0;
  if (step_number < 0) step_number = 3;

  switch (step_number) {
    case 0: 
      digitalWrite(STEPPER_PIN_1, HIGH); 
      digitalWrite(STEPPER_PIN_2, LOW);  
      digitalWrite(STEPPER_PIN_3, LOW);  
      digitalWrite(STEPPER_PIN_4, LOW); 
      break;
    case 1: 
      digitalWrite(STEPPER_PIN_1, LOW);  
      digitalWrite(STEPPER_PIN_2, HIGH);  
      digitalWrite(STEPPER_PIN_3, LOW);  
      digitalWrite(STEPPER_PIN_4, LOW); 
      break;
    case 2: 
      digitalWrite(STEPPER_PIN_1, LOW);  
      digitalWrite(STEPPER_PIN_2, LOW);  
      digitalWrite(STEPPER_PIN_3, HIGH); 
      digitalWrite(STEPPER_PIN_4, LOW); 
      break;
    case 3: 
      digitalWrite(STEPPER_PIN_1, LOW);  
      digitalWrite(STEPPER_PIN_2, LOW);  
      digitalWrite(STEPPER_PIN_3, LOW);  
      digitalWrite(STEPPER_PIN_4, HIGH); 
      break;
  }
}

// Hàm mở cửa
void moCua() {
  digitalWrite(IN1, LOW);
  analogWrite(IN2, 100);
  delay(500);
  analogWrite(IN2, 0);
  digitalWrite(IN1, LOW);
}

// Hàm đóng cửa
void dongCua() {
  digitalWrite(IN1, HIGH);
  analogWrite(IN2, 100);
  delay(500);
  analogWrite(IN2, 0);
  digitalWrite(IN1, LOW);
}
