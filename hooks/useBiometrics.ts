import { useState, useRef, useCallback } from 'react';
import { BiometricDataPoint, ConnectionStatus } from '../types';
import { DATA_WINDOW_SIZE } from '../constants';

// Types for Web Serial API (Kept for compatibility if needed later, but unused in virtual mode)
declare global {
  interface Navigator {
    serial: {
      requestPort(options?: { filters?: Array<{ usbVendorId: number; usbProductId?: number }> }): Promise<SerialPort>;
    };
  }

  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    close(): Promise<void>;
  }
}

export const useBiometrics = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [data, setData] = useState<BiometricDataPoint[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  
  // Refs
  const simulationInterval = useRef<number | null>(null);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  // Helper to add data point maintaining window size
  const addDataPoint = useCallback((point: BiometricDataPoint) => {
    setData(prev => {
      const newData = [...prev, point];
      if (newData.length > DATA_WINDOW_SIZE) {
        return newData.slice(newData.length - DATA_WINDOW_SIZE);
      }
      return newData;
    });
  }, []);

  // --- VIRTUAL SENSOR / SIMULATION MODE ---
  const startVirtualStream = useCallback(() => {
    if (simulationInterval.current) return;
    
    // We use 'SIMULATION' status internally but the UI treats it as a valid connection
    setStatus(ConnectionStatus.SIMULATION);
    
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

  // --- VIRTUAL CONNECTION HANDLER ---
  // This mimics the delay of a real hardware connection
  const connectVirtual = useCallback(async () => {
    setStatus(ConnectionStatus.CONNECTING);
    
    // Fake handshake delay (1.5 seconds)
    setTimeout(() => {
      startVirtualStream();
    }, 1500);
  }, [startVirtualStream]);

  const stopSimulation = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
  }, []);

  // --- DISCONNECT ---
  const disconnect = useCallback(async () => {
    stopSimulation();
    
    // Close serial resources if they were ever opened (compatibility safety)
    if (readerRef.current) {
      try { await readerRef.current.cancel(); } catch (e) { console.error(e); }
      readerRef.current = null;
    }
    if (portRef.current) {
      try { await portRef.current.close(); } catch (e) { console.error(e); }
      portRef.current = null;
    }

    setStatus(ConnectionStatus.DISCONNECTED);
    setData([]);
  }, [stopSimulation]);

  // Note: connectSerial is removed from export to force Virtual/Charge-Cable mode
  return {
    status,
    data,
    batteryLevel,
    connectVirtual, 
    disconnect
  };
};