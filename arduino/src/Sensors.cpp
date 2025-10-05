#include "Sensors.h"

// ---- Instantiate global sensor objects ----
Adafruit_BMP280 bmp;
MPU6050 mpu;
Adafruit_QMC5883P qmc;

void initSensors() {
  Serial.begin(115200);
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

  // ---- QMC5883 ----
  if (!qmc.begin()) {
    Serial.println("⚠️  QMC5883 not detected!");
  } else {
    Serial.println("✅ QMC5883 ready");
    qmc.setMode(QMC5883P_MODE_NORMAL);
    qmc.setODR(QMC5883P_ODR_50HZ);
    qmc.setOSR(QMC5883P_OSR_4);
    qmc.setDSR(QMC5883P_DSR_2);
    qmc.setRange(QMC5883P_RANGE_8G);
    qmc.setSetResetMode(QMC5883P_SETRESET_ON);
  }
}

// ----- Read BMP280 (Barometer and temperature) -----
BMP280Data readBMP280() {
  BMP280Data data;
  data.temperature = bmp.readTemperature();     // °C
  data.pressure = bmp.readPressure() / 100.0F;  // hPa
  return data;
}
// ----- Read QMC5883 (Magnetometer) -----
QMC5883Data readQMC5883() {
  QMC5883Data data;
  int16_t rawX, rawY, rawZ;
  float gx, gy, gz;

  if (qmc.isDataReady() && qmc.getRawMagnetic(&rawX, &rawY, &rawZ) && qmc.getGaussField(&gx, &gy, &gz)) {
    data.x = gx;
    data.y = gy;
    data.z = gz;
  } else {
    data.x = data.y = data.z = NAN;
  }

  return data;
}

// ----- Read MPU6050 (Accel/gyro) -----
MPU6050Data readMPU6050() {
  MPU6050Data data;
  mpu.getMotion6(&data.ax, &data.ay, &data.az, &data.gx, &data.gy, &data.gz);
  return data;
}
