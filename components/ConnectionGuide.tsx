import React from 'react';
import { Cable, AlertTriangle, Monitor, X, Check, Zap } from 'lucide-react';

interface ConnectionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemo: () => void;
}

export const ConnectionGuide: React.FC<ConnectionGuideProps> = ({ isOpen, onClose, onStartDemo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cable className="w-6 h-6 text-primary" />
            Connection Troubleshooting
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* CRITICAL ISSUE */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4">
            <div className="bg-red-500/20 p-3 rounded-full h-fit">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-200 mb-1">Device List Empty?</h3>
              <p className="text-slate-300 mb-2">
                If the browser shows "No compatible device found" or the list is empty, 
                <span className="text-white font-bold"> 90% of the time it is the cable.</span>
              </p>
              <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-700">
                <p className="mb-2"><strong className="text-red-300">"Charge-Only" Cables (Use for charging only)</strong></p>
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  <li>Often thin, white or black cables bundled with fans, lights, or power banks.</li>
                  <li><strong>Model MU240</strong> is typically a charge-only cable.</li>
                  <li>Only has 2 internal wires (Power). Cannot send data.</li>
                </ul>
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <X className="w-4 h-4" /> WON'T WORK
                </div>
              </div>
            </div>
          </div>

          {/* NO CABLE FALLBACK */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-4">
             <div className="bg-indigo-500/20 p-3 rounded-full h-fit">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-indigo-200 mb-1">Only have this cable?</h3>
              <p className="text-slate-300 mb-3">
                Don't worry! You can still use the application to test the features without connecting a real device.
              </p>
              <button 
                onClick={onStartDemo}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/20"
              >
                Launch Simulation Mode
              </button>
            </div>
          </div>

          {/* SOLUTION */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-4 opacity-75">
            <div className="bg-green-500/20 p-3 rounded-full h-fit">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-200 mb-1">For Future Reference</h3>
              <p className="text-slate-300 mb-2">
                To connect real hardware later, use a <strong>USB Data Sync Cable</strong> (like one from a smartphone).
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end flex-shrink-0">
          <button 
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};