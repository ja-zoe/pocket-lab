#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_BME680.h>   // 🔹 Library that also supports BME688
#include <MPU6050.h>
#include <Adafruit_HMC5883_U.h>   // For genuine HMC5883L
#include <WiFi.h>
#include <HTTPClient.h>
// ---- ESP-IDF log control ----
extern "C" {
  #include "esp_log.h"
}

// ---- WiFi credentials ----
const char* ssid = "RUatHome";
const char* password = "9Tc63j2SzTE9";

// ---- Backend endpoint ----
const char* serverUrl = "http://192.168.1.104:8000/api/sensor-data";

// ---- I2C pins ----
#define SDA_PIN 5
#define SCL_PIN 6

// ---- Sensor objects ----
Adafruit_BMP280 bmp;                  // BMP280
<<<<<<< HEAD
Adafruit_BME680 bme;                  // BME688 (same driver)
MPU6050 mpu;                          // MPU6050
Adafruit_HMC5883_Unified mag(12345);  // Magnetometer

// ---- BMP280 address ----
#define BMP280_ADDR 0x77

void setup() {
  Serial.begin(115200);
  esp_log_level_set("i2c.master", ESP_LOG_NONE);

  // ---- Connect WiFi ----
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
  Serial.println(WiFi.localIP());

  // ---- Initialize I2C ----
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(200);

  // ---- Initialize sensors ----
  if (!bmp.begin(BMP280_ADDR)) {
    Serial.println("⚠️ BMP280 not detected!");
=======
MPU6050 mpu;                          // MPU6050
Adafruit_HMC5883_Unified mag(12345);  // For HMC
// QMC5883LCompass mag;               // For QMC

// Pick the right BMP280 address after you scan
#define BMP280_ADDR 0x77  // or 0x77

void setup() {
  Serial.begin(115200);

  // Suppress noisy ESP-IDF logs for I2C
  esp_log_level_set("i2c.master", ESP_LOG_NONE);

  Wire.begin(SDA_PIN, SCL_PIN);
  delay(200);

  // ---- BMP280 ----
  if (!bmp.begin(BMP280_ADDR)) {
    Serial.println("⚠️  BMP280 not detected!");
>>>>>>> ccb096e9ad964485bd703975aff5afe8aa0249d7
  } else {
    Serial.println("✅ BMP280 ready");
  }

<<<<<<< HEAD
  if (!bme.begin(0x76)) {  // BME688 shares I2C with BMP280
    Serial.println("⚠️ BME688 not detected!");
  } else {
    Serial.println("✅ BME688 ready");
  }

  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("✅ MPU6050 ready");
  } else {
    Serial.println("⚠️ MPU6050 not detected!");
  }

  if (mag.begin()) {
    Serial.println("✅ Magnetometer ready");
  } else {
    Serial.println("⚠️ Magnetometer not detected!");
  }
=======
  // ---- MPU6050 ----
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("✅ MPU6050 ready");
  } else {
    Serial.println("⚠️  MPU6050 not detected!");
  }

  // ---- Magnetometer ----
  if (mag.begin()) {
    Serial.println("✅ Magnetometer ready");
  } else {
    Serial.println("⚠️  Magnetometer not detected!");
  }
  // For QMC:
  // mag.init();
>>>>>>> ccb096e9ad964485bd703975aff5afe8aa0249d7
}

void loop() {
  // --- Read BMP280 ---
  float temperature_bmp = bmp.readTemperature();
  float pressure_bmp = bmp.readPressure() / 100.0F;

  // --- Read BME688 ---
  bme.performReading();
  float temperature_bme = bme.temperature;
  float humidity_bme = bme.humidity;
  float pressure_bme = bme.pressure / 100.0F;
  float gas_bme = bme.gas_resistance / 1000.0; // in KΩ

  // --- Read MPU6050 accelerometer & gyroscope ---
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;

  float gx_dps = gx / 131.0;
  float gy_dps = gy / 131.0;
  float gz_dps = gz / 131.0;

  // --- Read magnetometer ---
  sensors_event_t event;
  mag.getEvent(&event);

  // --- Build JSON in backend expected format ---
  StaticJsonDocument<768> doc;

  // Required fields for backend
  doc["session_id"] = "esp32_session";
  doc["timestamp"] = millis();
  doc["temperature"] = temperature_bme;  // Use BME temperature
  doc["pressure"] = pressure_bme;        // Use BME pressure
  doc["humidity"] = humidity_bme;
  doc["voc"] = gas_bme / 1000.0;         // Convert kΩ to appropriate unit
  doc["accelX"] = ax_g;
  doc["accelY"] = ay_g;
  doc["accelZ"] = az_g;
  doc["gyroX"] = gx_dps;
  doc["gyroY"] = gy_dps;
  doc["gyroZ"] = gz_dps;
  doc["distance"] = 25.0;                // Default distance (no ultrasonic sensor)

  String json;
  serializeJson(doc, json);
  Serial.println(json);

  // --- Send JSON to backend ---
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(json);
    
    if (httpResponseCode > 0) {
      Serial.printf("Data sent! Response: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("WiFi not connected!");
  }
  delay(500);
}
