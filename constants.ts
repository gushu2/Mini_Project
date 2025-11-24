
// Configuration for Web Serial API
export const SERIAL_CONFIG = {
  BAUD_RATE: 115200, // Must match the Serial.begin() in Arduino code
};

export const THRESHOLDS = {
  STRESS_HIGH: 75,
  STRESS_MODERATE: 50,
  HR_MAX_ALERT: 120,
};

export const DATA_WINDOW_SIZE = 60; // Keep last 60 data points (approx 1 min if 1Hz)
