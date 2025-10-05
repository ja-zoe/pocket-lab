#pragma once
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_QMC5883P.h>
#include <MPU6050.h>

// ---- I2C pin configuration ----
#define SDA_PIN 5
#define SCL_PIN 6

// ---- Sensor addresses ----
#define BMP280_ADDR 0x77

// ---- Global sensor objects ----
extern Adafruit_BMP280 bmp;
extern MPU6050 mpu;
extern Adafruit_QMC5883P qmc;

// ---- Function prototypes ----
void initSensors();

// Data structures
struct BMP280Data {
  float temperature;
  float pressure;
};

struct QMC5883Data {
  float x;
  float y;
  float z;
};

struct MPU6050Data {
  int16_t ax;
  int16_t ay;
  int16_t az;
  int16_t gx;
  int16_t gy;
  int16_t gz;
};

// Reading functions
BMP280Data readBMP280();
QMC5883Data readQMC5883();
MPU6050Data readMPU6050();
