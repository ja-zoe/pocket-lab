#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <MPU6050.h>
#include <Adafruit_HMC5883_U.h>   // Use for HMC5883L
// #include <QMC5883LCompass.h>  // Uncomment if you use QMC5883L instead

// I2C pins
#define SDA_PIN 5
#define SCL_PIN 6

// Sensor objects
Adafruit_BMP280 bmp;
MPU6050 mpu;
Adafruit_HMC5883_Unified mag = Adafruit_HMC5883_Unified(12345);
// QMC5883LCompass mag;   // use this line instead for QMC module

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(200);

  // ---- BMP280 ----
  if (!bmp.begin(0x76) && !bmp.begin(0x77)) {
    Serial.println("⚠️  BMP280 not detected!");
  } else {
    Serial.println("✅ BMP280 ready");
  }

  // ---- MPU6050 ----
  mpu.initialize();
  if (mpu.testConnection()) Serial.println("✅ MPU6050 ready");
  else Serial.println("⚠️  MPU6050 not detected!");

  // ---- Magnetometer ----
  if (mag.begin()) Serial.println("✅ Magnetometer ready");
  else Serial.println("⚠️  Magnetometer not detected!");
  // For QMC: mag.init();
}

void loop() {
  // --- Read BMP280 ---
  float temperature = bmp.readTemperature();         // °C
  float pressure = bmp.readPressure() / 100.0F;      // hPa

  // --- Read MPU6050 accelerometer & gyroscope ---
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Convert raw accelerometer values to g (±2g scale)
  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;

  // Convert raw gyroscope values to degrees/sec (±250°/s scale)
  float gx_dps = gx / 131.0;
  float gy_dps = gy / 131.0;
  float gz_dps = gz / 131.0;

  // --- Read magnetometer ---
  sensors_event_t event;
  mag.getEvent(&event);  // for QMC use mag.read(), mag.getX(), etc.

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

  delay(2000);  // new reading every 2 s
}
