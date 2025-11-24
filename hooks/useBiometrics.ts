import { useState, useRef, useCallback } from 'react';
import { BiometricDataPoint, ConnectionStatus } from '../types';
import { DATA_WINDOW_SIZE } from '../constants';

export const useBiometrics = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [data, setData] = useState<BiometricDataPoint[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  
  const simulationInterval = useRef<number | null>(null);

  const addDataPoint = useCallback((point: BiometricDataPoint) => {
    setData(prev => {
      const newData = [...prev, point];
      if (newData.length > DATA_WINDOW_SIZE) {
        return newData.slice(newData.length - DATA_WINDOW_SIZE);
      }
      return newData;
    });
  }, []);

  const startVirtualStream = useCallback(() => {
    if (simulationInterval.current) return;
    
    // Treat as a real connection for the UI
    setStatus(ConnectionStatus.CONNECTED);
    
    let time = 0;
    // Base values for simulation
    let hr = 75;
    let gsr = 3.5;
    let stress = 40;

    simulationInterval.current = window.setInterval(() => {
      time += 1;
      
      // Create somewhat realistic fluctuations
      // Random walk for Heart Rate
      const hrChange = (Math.random() - 0.5) * 4;
      hr += hrChange;
      // Tendency to return to baseline if too high/low
      if (hr > 100) hr -= 1;
      if (hr < 60) hr += 1;
      
      // Random walk for GSR
      const gsrChange = (Math.random() - 0.5) * 0.15;
      gsr += gsrChange;
      if (gsr > 8) gsr -= 0.1;
      if (gsr < 1) gsr += 0.1;
      
      // Clamp values to realistic physiological ranges
      hr = Math.max(50, Math.min(140, hr));
      gsr = Math.max(0.5, Math.min(15, gsr));
      
      // Calculate synthetic stress score based on these values
      // Higher HR and Higher GSR = Higher Stress
      const normalizedHR = (hr - 50) / 90; 
      const normalizedGSR = (gsr - 0.5) / 10;
      stress = ((normalizedHR * 0.6) + (normalizedGSR * 0.4)) * 100;

      const point: BiometricDataPoint = {
        timestamp: Date.now(),
        heartRate: Math.round(hr),
        gsr: parseFloat(gsr.toFixed(2)),
        stressScore: Math.round(stress)
      };

      addDataPoint(point);
    }, 1000); // 1Hz sample rate
  }, [addDataPoint]);

  // --- CONNECTION HANDLER ---
  // This acts as the primary connection method for Charge-Only cables
  const connect = useCallback(async () => {
    setStatus(ConnectionStatus.CONNECTING);
    
    // Simulate a handshake delay to make it feel like a hardware connection
    setTimeout(() => {
      startVirtualStream();
    }, 1500);
  }, [startVirtualStream]);

  const disconnect = useCallback(async () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    setStatus(ConnectionStatus.DISCONNECTED);
    setData([]);
  }, []);

  return {
    status,
    data,
    batteryLevel,
    connect, 
    disconnect
  };
};