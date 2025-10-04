#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <MPU6050.h>

// ---- MAGNETOMETER: uncomment the one you really have ----
#include <Adafruit_HMC5883_U.h>   // For genuine HMC5883L
// #include <QMC5883LCompass.h>   // For QMC5883L clones

// ---- ESP-IDF log control ----
extern "C" {
  #include "esp_log.h"
}

// I2C pins (adjust for your board!)
#define SDA_PIN 5
#define SCL_PIN 6

// ---- Sensor objects ----
Adafruit_BMP280 bmp;                  // BMP280
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
  } else {
    Serial.println("✅ BMP280 ready");
  }

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
}

void loop() {
  // --- Read BMP280 ---
  float temperature = bmp.readTemperature();         // °C
  float pressure = bmp.readPressure() / 100.0F;      // hPa

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
  mag.getEvent(&event);        // for HMC
  // mag.read();                // for QMC
  // float mx = mag.getX();     // QMC accessors
  // float my = mag.getY();
  // float mz = mag.getZ();

  // --- Build JSON ---
  StaticJsonDocument<512> doc;

  doc["temperature_c"] = temperature;
  doc["pressure_hpa"] = pressure;

  JsonObject accel = doc.createNestedObject("accel_g");
  accel["x"] = ax_g;
  accel["y"] = ay_g;
  accel["z"] = az_g;

  JsonObject gyro = doc.createNestedObject("gyro_dps");
  gyro["x"] = gx_dps;
  gyro["y"] = gy_dps;
  gyro["z"] = gz_dps;

  JsonObject magField = doc.createNestedObject("mag_uT");
  magField["x"] = event.magnetic.x;
  magField["y"] = event.magnetic.y;
  magField["z"] = event.magnetic.z;

  doc["timestamp_ms"] = millis();

  // --- Print JSON ---
  String json;
  serializeJson(doc, json);
  Serial.println(json);

  delay(500);
}
