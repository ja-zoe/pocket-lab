#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_BME680.h>   // 🔹 Library that also supports BME688
#include <MPU6050.h>
<<<<<<< HEAD
#include <Adafruit_HMC5883_U.h>
#include <WiFi.h>
#include <HTTPClient.h>

=======

// ---- MAGNETOMETER: uncomment the one you really have ----
#include <Adafruit_HMC5883_U.h>   // For genuine HMC5883L
// #include <QMC5883LCompass.h>   // For QMC5883L clones

>>>>>>> ccb096e9ad964485bd703975aff5afe8aa0249d7
// ---- ESP-IDF log control ----
extern "C" {
  #include "esp_log.h"
}

<<<<<<< HEAD
// ---- WiFi credentials ----
const char* ssid = "RUatHome";
const char* password = "9Tc63j2SzTE9";

// ---- Backend endpoint ----
const char* serverUrl = "http://your-server.com/api/sensor";

// ---- I2C pins ----
=======
// I2C pins (adjust for your board!)
>>>>>>> ccb096e9ad964485bd703975aff5afe8aa0249d7
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
<<<<<<< HEAD
  mag.getEvent(&event);

  // --- Build JSON ---
  StaticJsonDocument<768> doc;

  doc["timestamp_ms"] = millis();

  JsonObject bmp280 = doc.createNestedObject("bmp280");
  bmp280["temperature_c"] = temperature_bmp;
  bmp280["pressure_hpa"] = pressure_bmp;

  JsonObject bme688 = doc.createNestedObject("bme688");
  bme688["temperature_c"] = temperature_bme;
  bme688["humidity_%"] = humidity_bme;
  bme688["pressure_hpa"] = pressure_bme;
  bme688["gas_kohm"] = gas_bme;
=======
  mag.getEvent(&event);        // for HMC
  // mag.read();                // for QMC
  // float mx = mag.getX();     // QMC accessors
  // float my = mag.getY();
  // float mz = mag.getZ();

  // --- Build JSON ---
  StaticJsonDocument<512> doc;

  doc["temperature_c"] = temperature;
  doc["pressure_hpa"] = pressure;
>>>>>>> ccb096e9ad964485bd703975aff5afe8aa0249d7

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

  String json;
  serializeJson(doc, json);
  Serial.println(json);

<<<<<<< HEAD
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

=======
>>>>>>> ccb096e9ad964485bd703975aff5afe8aa0249d7
  delay(500);
}
