#include <Wire.h>
#include <WiFi.h>
#include <ESPSupabase.h>
#include <MPU6050.h>
#include "secrets.h"

const String table = "minimal_data";

// Accelerometer
MPU6050 mpu;

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

  // Initialize I2C and MPU6050
  Wire.begin();
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("✅ MPU6050 ready");
  } else {
    Serial.println("⚠️ MPU6050 not detected!");
  }

  // Initialize Supabase
  db.begin(SUPABASE_URL, SUPABASE_KEY);
}

void loop() {
  // Read accelerometer values
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Convert to g-force
  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;

  // Build JSON payload
  String payload = String("{\"accel_x\":") + ax_g + ",\"accel_y\":" + ay_g + ",\"accel_z\":" + az_g + "}";

  // Send data to Supabase
  if (WiFi.status() == WL_CONNECTED) {
    int code = db.insert(table, payload, false);
    if (code == 200 || code == 201) {
      Serial.println("✅ Data sent successfully");
    } else {
      Serial.printf("⚠️ Error sending data: %d\n", code);
    }
    db.urlQuery_reset();
  }

  delay(2000); // Send every 2 seconds
}
