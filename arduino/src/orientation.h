struct Orientation {
  float pitch;
  float roll;
  float yaw;
};

Orientation calculateOrientation(
  float ax, float ay, float az,
  float gx, float gy, float gz,
  float mx, float my, float mz,
  float dt // time difference in seconds
);