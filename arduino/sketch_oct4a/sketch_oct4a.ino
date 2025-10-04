#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <MPU6050.h>
#include <Adafruit_HMC5883_U.h>   // Use for HMC5883L
// #include <QMC5883LCompass.h>  // Uncomment if you use QMC5883L instead

// I2C pins
#define SDA_PIN 21
#define SCL_PIN 22

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

  // --- Read MPU6050 accelerometer ---
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;

  // --- Read magnetometer ---
  sensors_event_t event;
  mag.getEvent(&event);  // for QMC use mag.read(), mag.getX(), etc.

  // --- Build JSON ---
  StaticJsonDocument<256> doc;
  doc["temperature_c"] = temperature;
  doc["pressure_hpa"] = pressure;
  doc["accel_g"]["x"] = ax_g;
  doc["accel_g"]["y"] = ay_g;
  doc["accel_g"]["z"] = az_g;
  doc["mag_uT"]["x"] = event.magnetic.x;
  doc["mag_uT"]["y"] = event.magnetic.y;
  doc["mag_uT"]["z"] = event.magnetic.z;
  doc["timestamp_ms"] = millis();

  String json;
  serializeJson(doc, json);
  Serial.println(json);

  delay(2000);  // new reading every 2 s
}
