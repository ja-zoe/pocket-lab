#include <Wire.h>
#include <WiFi.h>
#include <ESPSupabase.h>
#include "secrets.h"
#include "Sensors.h"
#include "orientation.h"

const char* table = "sensor_readings";

// db init
Supabase db;

void setup() {
  Serial.begin(115200);

  // Connect Wi-Fi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid,password);
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

unsigned long prevTime = 0;

void loop() {
  // Read sensors
  BMP280Data bmpData = readBMP280();
  QMC5883Data qmcData = readQMC5883();
  MPU6050Data mpuData = readMPU6050();

  unsigned long currentTime = millis();
  float dt = (currentTime - prevTime) / 1000.0; // seconds
  prevTime = currentTime;

  Orientation o = calculateOrientation(
    mpuData.ax, mpuData.ay, mpuData.az,
    mpuData.gx, mpuData.gy, mpuData.gz,
    qmcData.x, qmcData.y, qmcData.z,
    dt
  );

  Serial.print("Pitch: "); Serial.print(o.pitch, 2);
  Serial.print("° Roll: "); Serial.print(o.roll, 2);
  Serial.print("° Yaw: "); Serial.println(o.yaw, 2);
  Serial.println(F("==== Sensor Readings ===="));
  
  // BMP280
  Serial.print(F("BMP280 - Temp: "));
  Serial.print(bmpData.temperature, 2);
  Serial.print(" °C, Pressure: ");
  Serial.print(bmpData.pressure, 2);
  Serial.println(" hPa");

  // QMC5883
  Serial.print(F("QMC5883 - X: "));
  Serial.print(qmcData.x, 3);
  Serial.print(" Y: ");
  Serial.print(qmcData.y, 3);
  Serial.print(" Z: ");
  Serial.println(qmcData.z, 3);

  // MPU6050
  Serial.print(F("MPU6050 - Accel X: "));
  Serial.print(mpuData.ax);
  Serial.print(" Y: ");
  Serial.print(mpuData.ay);
  Serial.print(" Z: ");
  Serial.println(mpuData.az);

  Serial.print(F("MPU6050 - Gyro X: "));
  Serial.print(mpuData.gx);
  Serial.print(" Y: ");
  Serial.print(mpuData.gy);
  Serial.print(" Z: ");
  Serial.println(mpuData.gz);

  Serial.println(F("========================"));

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
  int code = db.insert(String(table), payload, false);
  if (code == 200 || code == 201) {
    Serial.println("✅ Sensor data sent successfully");
  } else {
    Serial.printf("⚠️ Error sending sensor data: %d\n", code);
  }

  // Reset URL query buffer
  db.urlQuery_reset();

  delay(50); // send every 0.5 seconds
}

