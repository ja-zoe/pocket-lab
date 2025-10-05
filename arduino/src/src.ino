#include <Wire.h>
#include <WiFi.h>
#include <ESPSupabase.h>
#include "secrets.h"
#include "Sensors.h"

const String table = "sensor_readings";

// db init
Supabase db;

void setup() {
  Serial.begin(115200);

  // Connect Wi-Fi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");

  // Initialize sensors
  initSensors();

  // Initialize Supabase
  db.begin(SUPABASE_URL, SUPABASE_KEY);
}

void loop() {
  // Read sensors
  BMP280Data bmpData = readBMP280();
  QMC5883Data qmcData = readQMC5883();
  MPU6050Data mpuData = readMPU6050();

  // Build JSON payload for Supabase
  String payload = "{";
  payload += "\"device_id\":\"esp32_01\",";
  
  // BMP280
  payload += "\"temperature\":" + String(bmpData.temperature, 2) + ",";
  payload += "\"pressure\":" + String(bmpData.pressure, 2) + ",";

  // QMC5883
  payload += "\"mag_x\":" + String(qmcData.x, 3) + ",";
  payload += "\"mag_y\":" + String(qmcData.y, 3) + ",";
  payload += "\"mag_z\":" + String(qmcData.z, 3) + ",";

  // MPU6050
  payload += "\"accel_x\":" + String(mpuData.ax) + ",";
  payload += "\"accel_y\":" + String(mpuData.ay) + ",";
  payload += "\"accel_z\":" + String(mpuData.az) + ",";
  payload += "\"gyro_x\":" + String(mpuData.gx) + ",";
  payload += "\"gyro_y\":" + String(mpuData.gy) + ",";
  payload += "\"gyro_z\":" + String(mpuData.gz); // <- no trailing comma

  payload += "}";

  // Send data to Supabase
  int code = db.insert(table, payload, false);
  if (code == 200 || code == 201) {
    Serial.println("✅ Sensor data sent successfully");
  } else {
    Serial.printf("⚠️ Error sending sensor data: %d\n", code);
  }

  // Reset URL query buffer
  db.urlQuery_reset();

  delay(2000); // send every 2 seconds
}
