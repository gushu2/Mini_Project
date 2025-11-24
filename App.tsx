import React, { useEffect, useState } from 'react';
import { useBiometrics } from './hooks/useBiometrics';
import { ConnectionStatus, BiometricDataPoint } from './types';
import { StressGauge } from './components/StressGauge';
import { AICoach } from './components/AICoach';
import { THRESHOLDS } from './constants';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Unplug, Power, Heart, Droplets, Signal, CheckCircle2
} from 'lucide-react';

const App: React.FC = () => {
  // "connectVirtual" replaces the physical USB connection flow
  const { status, data, connectVirtual, disconnect } = useBiometrics();
  const [current, setCurrent] = useState<BiometricDataPoint | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      setCurrent(data[data.length - 1]);
    }
  }, [data]);

  // Treat SIMULATION status as a valid connection for this use case
  const isConnected = status === ConnectionStatus.CONNECTED || status === ConnectionStatus.SIMULATION;
  const isConnecting = status === ConnectionStatus.CONNECTING;
  const isHighStress = (current?.stressScore || 0) > THRESHOLDS.STRESS_HIGH;

  return (
    <div className="min-h-screen bg-background text-slate-200 p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NeuroFlow</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Biometric Stress Analytics</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 bg-surface p-2 rounded-xl border border-slate-700">
          <div className="px-3 flex flex-col items-end min-w-[120px]">
             <span className={`text-xs font-bold uppercase ${
               status === 'ERROR' ? 'text-red-400' : 
               isConnected ? 'text-green-400' : 'text-slate-400'
             }`}>
               {isConnected ? 'System Active' : isConnecting ? 'Calibrating...' : 'Standby'}
             </span>
             {isConnected && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Signal className="w-3 h-3" /> Signal Stable</span>}
          </div>
          
          {isConnected ? (
            <button 
              onClick={disconnect}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-2.5 rounded-lg transition-all font-medium border border-red-500/10"
            >
              <Unplug className="w-4 h-4" />
              Stop Monitor
            </button>
          ) : (
            <button 
              onClick={connectVirtual}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-bold shadow-lg ${
                isConnecting 
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-primary hover:bg-sky-500 text-slate-900 shadow-primary/25'
              }`}
            >
              {isConnecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  Connect Sensor
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: METRICS & GAUGE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Status Card */}
          <div className="bg-surface rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
             {/* Alert Overlay */}
             {isHighStress && isConnected && (
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
             )}
             
             <div className="flex flex-col items-center justify-center py-4 min-h-[260px]">
               {isConnected ? (
                 <StressGauge value={current?.stressScore || 0} size={240} />
               ) : (
                 <div className="flex flex-col items-center text-slate-600">
                   <Power className="w-16 h-16 mb-4 opacity-20" />
                   <p className="text-sm uppercase tracking-widest font-medium">Sensor Offline</p>
                   <p className="text-xs mt-2 opacity-50">Connect device to begin analysis</p>
                 </div>
               )}
             </div>

             <div className="grid grid-cols-2 gap-4 mt-4">
               <div className={`p-4 rounded-xl border flex flex-col items-center transition-colors ${
                 isConnected ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-800/30 border-slate-800/50 opacity-50'
               }`}>
                  <Heart className="w-6 h-6 text-red-400 mb-2" />
                  <span className="text-2xl font-bold text-white">{isConnected ? (current?.heartRate || '--') : '--'}</span>
                  <span className="text-xs text-slate-500 uppercase">BPM</span>
               </div>
               <div className={`p-4 rounded-xl border flex flex-col items-center transition-colors ${
                 isConnected ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-800/30 border-slate-800/50 opacity-50'
               }`}>
                  <Droplets className="w-6 h-6 text-cyan-400 mb-2" />
                  <span className="text-2xl font-bold text-white">{isConnected ? (current?.gsr.toFixed(1) || '--') : '--'}</span>
                  <span className="text-xs text-slate-500 uppercase">GSR (µS)</span>
               </div>
             </div>
          </div>

          {/* AI Coach Panel (Mobile: Stacked, Desktop: Sidebar) */}
          <div className="h-[500px]">
             <AICoach recentData={data} isHighStress={isHighStress} />
          </div>

        </div>

        {/* RIGHT COLUMN: CHARTS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Heart Rate Chart */}
          <div className="bg-surface rounded-2xl p-6 border border-slate-700 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary" />
              Real-time Heart Rate
            </h3>
            <div className="h-[250px] w-full">
              {isConnected && data.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tick={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      domain={['dataMin - 10', 'dataMax + 10']} 
                      stroke="#94a3b8" 
                      tick={{fill: '#94a3b8', fontSize: 12}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelFormatter={() => ''}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="heartRate" 
                      stroke="#818cf8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorHr)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl">
                    <p className="text-slate-500 text-sm">Waiting for data stream...</p>
                 </div>
              )}
            </div>
          </div>

          {/* GSR Chart */}
          <div className="bg-surface rounded-2xl p-6 border border-slate-700 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Galvanic Skin Response
            </h3>
            <div className="h-[250px] w-full">
              {isConnected && data.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                    <YAxis 
                      domain={[0, 10]} 
                      stroke="#94a3b8" 
                      tick={{fill: '#94a3b8', fontSize: 12}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelFormatter={() => ''}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gsr" 
                      stroke="#38bdf8" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl">
                    <p className="text-slate-500 text-sm">Waiting for data stream...</p>
                 </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;