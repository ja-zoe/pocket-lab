#include "orientation.h"
#include <math.h>

// Calculate pitch, roll, yaw using accelerometer, gyro, and magnetometer
Orientation calculateOrientation(
  float ax, float ay, float az,
  float gx, float gy, float gz,
  float mx, float my, float mz,
  float dt // time difference in seconds
) {
  static float pitch = 0, roll = 0, yaw = 0;

  // --- Calculate pitch and roll from accelerometer ---
  float pitchAcc = atan2(-ax, sqrt(ay * ay + az * az));
  float rollAcc  = atan2(ay, az);

  // --- Integrate gyro for pitch and roll (simple complementary filter) ---
  float alpha = 0.98; // complementary filter constant
  pitch = alpha * (pitch + gx * dt * M_PI / 180.0) + (1 - alpha) * pitchAcc;
  roll  = alpha * (roll  + gy * dt * M_PI / 180.0) + (1 - alpha) * rollAcc;

  // --- Tilt-compensated yaw (heading) from magnetometer ---
  float Xh = mx * cos(pitch) + mz * sin(pitch);
  float Yh = mx * sin(roll) * sin(pitch) + my * cos(roll) - mz * sin(roll) * cos(pitch);
  yaw = atan2(-Yh, Xh);

  // Convert to degrees
  Orientation o;
  o.pitch = pitch * 180.0 / M_PI;
  o.roll  = roll  * 180.0 / M_PI;
  o.yaw   = yaw   * 180.0 / M_PI;
  return o;
}

