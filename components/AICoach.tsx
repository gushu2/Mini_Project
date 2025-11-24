import React, { useState, useEffect } from 'react';
import { BiometricDataPoint, AIResponse } from '../types';
import { analyzeStress } from '../services/geminiService';
import { Sparkles, Brain, Wind, Activity, AlertCircle } from 'lucide-react';

interface AICoachProps {
  recentData: BiometricDataPoint[];
  isHighStress: boolean;
}

export const AICoach: React.FC<AICoachProps> = ({ recentData, isHighStress }) => {
  const [advice, setAdvice] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number>(0);

  const getAdvice = async () => {
    if (recentData.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeStress(recentData);
      setAdvice(result);
      setLastAnalysisTime(Date.now());
    } catch (err) {
      setError("Unable to contact AI Coach. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger if high stress persists (debounced 1 min)
  useEffect(() => {
    if (isHighStress && Date.now() - lastAnalysisTime > 60000 && !loading) {
      getAdvice();
    }
  }, [isHighStress, recentData, lastAnalysisTime, loading]);

  return (
    <div className="bg-surface rounded-xl p-6 shadow-lg border border-slate-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-xl font-bold text-white">NeuroFlow AI Coach</h2>
        </div>
        <button
          onClick={getAdvice}
          disabled={loading || recentData.length < 5}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            loading 
              ? 'bg-slate-700 text-slate-400 cursor-wait' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze Now'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {!advice && !loading && !error && (
          <div className="text-center text-slate-400 py-10 flex flex-col items-center">
            <Brain className="w-12 h-12 mb-3 opacity-50" />
            <p>Connect device and gather data to receive personalized insights.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {advice && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-2 font-bold">Analysis</h3>
              <p className="text-slate-200 leading-relaxed">{advice.analysis}</p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3 font-bold">Recommendations</h3>
              <div className="grid gap-3">
                {advice.recommendations.map((rec) => (
                  <div 
                    key={rec.id || Math.random().toString()} 
                    className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        rec.type === 'breathing' ? 'bg-blue-500/20 text-blue-400' :
                        rec.type === 'physical' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {rec.type === 'breathing' ? <Wind className="w-5 h-5" /> : 
                         rec.type === 'physical' ? <Activity className="w-5 h-5" /> : 
                         <Brain className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                        <p className="text-sm text-slate-400">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
