#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_BME680.h>
#include <MPU6050.h>
#include <Adafruit_QMC5883P.h>


// ------------------- Structs -------------------
struct SensorData {
    float temperature;
    float pressure;
    float humidity;  // BME688 only
    float gas;       // BME688 only
};

struct MotionData {
    float ax, ay, az;
    float gx, gy, gz;
};

struct MagData {
    float x, y, z;
};

// ------------------- Initialization -------------------
void initSensors(Adafruit_BMP280 &bmp, Adafruit_BME680 &bme, MPU6050 &mpu, Adafruit_QMC5883P &qmc);

// ------------------- Read Functions -------------------
SensorData readBMP280(Adafruit_BMP280 &bmp);
SensorData readBME688(Adafruit_BME680 &bme);
MotionData readMPU6050(MPU6050 &mpu);
MagData readMagnetometer(QMC5883LCompass &mag);

// ------------------- JSON Helper Functions -------------------
void addBMP280ToJson(StaticJsonDocument<768> &doc, const SensorData &data);
void addBME688ToJson(StaticJsonDocument<768> &doc, const SensorData &data);
void addMotionToJson(StaticJsonDocument<768> &doc, const MotionData &data);
void addMagnetometerToJson(StaticJsonDocument<768> &doc, const MagData &data);

#endif
