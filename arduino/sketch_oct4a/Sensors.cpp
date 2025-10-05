#include "Sensors.h"

// ------------------- Initialization -------------------
void initSensors(Adafruit_BMP280 &bmp, Adafruit_BME680 &bme, MPU6050 &mpu) {
    Wire.begin();

    if (!bmp.begin(0x77)) Serial.println("⚠️ BMP280 not detected!");
    else Serial.println("✅ BMP280 ready");

    if (!bme.begin(0x76)) Serial.println("⚠️ BME688 not detected!");
    else Serial.println("✅ BME688 ready");

    mpu.initialize();
    if (mpu.testConnection()) Serial.println("✅ MPU6050 ready");
    else Serial.println("⚠️ MPU6050 not detected!");

    Serial.println("✅ QMC5883 magnetometer ready");
}

// ------------------- Read Functions -------------------
SensorData readBMP280(Adafruit_BMP280 &bmp) {
    SensorData data;
    data.temperature = bmp.readTemperature();
    data.pressure = bmp.readPressure() / 100.0F;
    return data;
}

SensorData readBME688(Adafruit_BME680 &bme) {
    SensorData data;
    bme.performReading();
    data.temperature = bme.temperature;
    data.humidity = bme.humidity;
    data.pressure = bme.pressure / 100.0F;
    data.gas = bme.gas_resistance / 1000.0; // KΩ
    return data;
}

MotionData readMPU6050(MPU6050 &mpu) {
    MotionData data;
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    data.ax = ax / 16384.0;
    data.ay = ay / 16384.0;
    data.az = az / 16384.0;

    data.gx = gx / 131.0;
    data.gy = gy / 131.0;
    data.gz = gz / 131.0;
    return data;
}

// ------------------- JSON Helper Functions -------------------
void addBMP280ToJson(StaticJsonDocument<768> &doc, const SensorData &data) {
    JsonObject obj = doc.createNestedObject("bmp280");
    obj["temperature_c"] = data.temperature;
    obj["pressure_hpa"] = data.pressure;
}

void addBME688ToJson(StaticJsonDocument<768> &doc, const SensorData &data) {
    JsonObject obj = doc.createNestedObject("bme688");
    obj["temperature_c"] = data.temperature;
    obj["humidity_%"] = data.humidity;
    obj["pressure_hpa"] = data.pressure;
    obj["gas_kohm"] = data.gas;
}

void addMotionToJson(StaticJsonDocument<768> &doc, const MotionData &data) {
    JsonObject accel = doc.createNestedObject("accel_g");
    accel["x"] = data.ax;
    accel["y"] = data.ay;
    accel["z"] = data.az;

    JsonObject gyro = doc.createNestedObject("gyro_dps");
    gyro["x"] = data.gx;
    gyro["y"] = data.gy;
    gyro["z"] = data.gz;
}

void addMagnetometerToJson(StaticJsonDocument<768> &doc, const MagData &data) {
    JsonObject obj = doc.createNestedObject("mag_uT");
    obj["x"] = data.x;
    obj["y"] = data.y;
    obj["z"] = data.z;
}
