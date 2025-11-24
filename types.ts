export interface BiometricDataPoint {
  timestamp: number;
  heartRate: number; // Beats per minute
  gsr: number;       // Galvanic Skin Response (uS - microsiemens)
  stressScore: number; // Calculated 0-100
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  SIMULATION = 'SIMULATION',
  ERROR = 'ERROR'
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'breathing' | 'cognitive' | 'physical' | 'mindfulness';
}

export interface AIResponse {
  analysis: string;
  recommendations: Recommendation[];
}
