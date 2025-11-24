import { useState, useRef, useCallback } from 'react';
import { BiometricDataPoint, ConnectionStatus } from '../types';
import { DATA_WINDOW_SIZE, SERIAL_CONFIG } from '../constants';

export const useBiometrics = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [data, setData] = useState<BiometricDataPoint[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const keepReadingRef = useRef<boolean>(false);

  const addDataPoint = useCallback((point: BiometricDataPoint) => {
    setData(prev => {
      const newData = [...prev, point];
      if (newData.length > DATA_WINDOW_SIZE) {
        return newData.slice(newData.length - DATA_WINDOW_SIZE);
      }
      return newData;
    });
  }, []);

  const parseLine = (line: string): BiometricDataPoint | null => {
    try {
      // Expecting JSON format from Arduino: {"hr": 75, "gsr": 2.5, "stress": 40}
      // Or CSV: 75,2.5,40
      line = line.trim();
      if (!line) return null;

      let hr = 0, gsr = 0, stress = 0;

      if (line.startsWith('{')) {
        const parsed = JSON.parse(line);
        hr = parsed.hr || parsed.heartRate || 0;
        gsr = parsed.gsr || 0;
        stress = parsed.stress || parsed.stressScore || 0;
      } else {
        const parts = line.split(',');
        if (parts.length >= 2) {
          hr = parseFloat(parts[0]);
          gsr = parseFloat(parts[1]);
          stress = parts.length > 2 ? parseFloat(parts[2]) : 0;
        }
      }

      // Basic validation
      if (isNaN(hr) || isNaN(gsr)) return null;

      // Calculate stress if not provided by hardware
      if (stress === 0 && hr > 0) {
        // Fallback calculation
        const normalizedHR = Math.min(Math.max((hr - 60) / 60, 0), 1);
        const normalizedGSR = Math.min(Math.max((gsr - 0.1) / 10, 0), 1);
        stress = ((normalizedHR * 0.6) + (normalizedGSR * 0.4)) * 100;
      }

      return {
        timestamp: Date.now(),
        heartRate: hr,
        gsr: gsr,
        stressScore: Math.round(stress)
      };

    } catch (e) {
      console.warn("Failed to parse serial line:", line);
      return null;
    }
  };

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.error("Error canceling reader", e);
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        console.error("Error closing port", e);
      }
      portRef.current = null;
    }
    
    setStatus(ConnectionStatus.DISCONNECTED);
    setData([]);
  }, []);

  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.");
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      
      // Request the port - user must pick a device
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: SERIAL_CONFIG.BAUD_RATE });
      
      portRef.current = port;
      keepReadingRef.current = true;
      setStatus(ConnectionStatus.CONNECTED);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = "";

      while (keepReadingRef.current) {
        try {
            const { value, done } = await reader.read();
            if (done) {
              reader.releaseLock();
              break;
            }
    
            if (value) {
              buffer += value;
              const lines = buffer.split('\n');
              buffer = lines.pop() || ""; // Keep incomplete line in buffer
    
              for (const line of lines) {
                const point = parseLine(line);
                if (point) {
                  addDataPoint(point);
                }
              }
            }
        } catch (readError) {
             console.error("Read error:", readError);
             break; 
        }
      }
    } catch (error: any) {
      console.error("Serial Connection Error:", error);
      
      // Gracefully handle user cancellation (NotFoundError)
      if (error.name === 'NotFoundError') {
        setStatus(ConnectionStatus.DISCONNECTED);
      } else {
        setStatus(ConnectionStatus.ERROR);
        
        // Cleanup partial connection if needed
        if (portRef.current) {
           keepReadingRef.current = false;
           try { await portRef.current.close(); } catch(e) {}
           portRef.current = null;
        }
      }
    }
  }, [addDataPoint]);

  return {
    status,
    data,
    batteryLevel,
    connect, 
    disconnect
  };
};