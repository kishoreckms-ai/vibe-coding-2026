import React, { useState } from 'react';
import { Alert, Batch } from '../types';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface AlertsCenterProps {
  alerts: Alert[];
  batches: Batch[];
  onSelectBatch: (batch: Batch) => void;
  onResolveAlert: (alertId: string) => Promise<void>;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  alerts,
  batches,
  onSelectBatch,
  onResolveAlert
}) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Resolved'>('Active');

  const filtered = alerts.filter(a => {
    if (filter === 'Active') return !a.resolved;
    if (filter === 'Resolved') return a.resolved;
    return true;
  });

  return (
    <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Cold-Chain Anomalies & Real-Time Alerts
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Automated sensor threshold breaches, thermal spikes, and humidity excursions
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          {(['Active', 'All', 'Resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === tab
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab} ({alerts.filter(a => tab === 'All' ? true : tab === 'Active' ? !a.resolved : a.resolved).length})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          No {filter.toLowerCase()} alerts found. All cold-chain assets operating within specifications.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const batch = batches.find(b => b.id === alert.batchId);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  alert.resolved
                    ? 'bg-neutral-950/40 border-neutral-800/80 opacity-60'
                    : alert.severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-blue-950/20 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`p-2 rounded-xl mt-0.5 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.severity === 'CRITICAL' ? <AlertCircle className="w-5 h-5" /> : alert.severity === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-400">{alert.batchId}</span>
                      <span className="text-xs font-bold text-neutral-200">{alert.title}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!alert.resolved && (
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}

                  {batch && (
                    <button
                      onClick={() => onSelectBatch(batch)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      Inspect Batch
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
