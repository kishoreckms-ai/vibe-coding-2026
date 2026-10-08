import React, { useState } from 'react';
import { Batch, ProductSpec, Retailer } from '../types';
import { getStatusColor, formatCurrency } from '../utils/degradationModel';
import { TelemetryChart } from './TelemetryChart';
import { DegradationModelCard } from './DegradationModelCard';
import { LiquidationCard } from './LiquidationCard';
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Clock,
  Truck,
  MapPin,
  AlertTriangle,
  Zap,
  RotateCcw,
  Download,
  Calendar,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface BatchDetailsViewProps {
  batch: Batch;
  spec: ProductSpec;
  retailers: Retailer[];
  onBack: () => void;
  onInjectBreach: (batchId: string, type: 'temp_high' | 'humidity_drop' | 'restore') => Promise<void>;
  onDispatchLiquidation: (retailerId: string, discountPercent: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const BatchDetailsView: React.FC<BatchDetailsViewProps> = ({
  batch,
  spec,
  retailers,
  onBack,
  onInjectBreach,
  onDispatchLiquidation,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'model' | 'liquidation' | 'logs'>('overview');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const statusColors = getStatusColor(batch.status);
  const baselineDays = batch.initialShelfLifeDays || 7;
  const pctRemaining = Math.max(0, Math.min(100, batch.remainingShelfLifePercent));

  const handleBreachClick = async (type: 'temp_high' | 'humidity_drop' | 'restore') => {
    try {
      setIsActionLoading(true);
      await onInjectBreach(batch.id, type);
      await onRefresh();
    } finally {
      setIsActionLoading(false);
    }
  };

  const exportTelemetryCsv = () => {
    if (!batch.telemetryHistory.length) return;
    const headers = ['Timestamp', 'Transit_Hours', 'Temperature_C', 'Humidity_Percent', 'Aging_Velocity', 'Remaining_Days', 'Location'];
    const rows = batch.telemetryHistory.map(t => [
      t.timestamp,
      t.transitDurationHours,
      t.temperature,
      t.humidity,
      t.combinedAgingFactor,
      t.remainingShelfLifeDays,
      `"${t.location}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_${batch.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400">{batch.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors.badge}`}>
                {batch.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                {batch.category}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-neutral-100 mt-0.5">
              {batch.productName}
            </h1>
          </div>
        </div>

        {/* Quick Simulation Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleBreachClick('temp_high')}
            disabled={isActionLoading}
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Inject Thermal Spike (+8°C)
          </button>
          <button
            onClick={() => handleBreachClick('humidity_drop')}
            disabled={isActionLoading}
            className="px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Droplets className="w-3.5 h-3.5 text-amber-400" />
            Inject Dry Air Breach (-22% RH)
          </button>
          <button
            onClick={() => handleBreachClick('restore')}
            disabled={isActionLoading}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            Restore Setpoint
          </button>
        </div>
      </div>

      {/* Transit & Key Metric Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gauge 1: Current Temp */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-blue-400" /> Temperature
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">Sensor #{batch.sensorId.split('-')[1]}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 flex items-baseline gap-2">
            <span>{batch.currentTemp.toFixed(1)}°C</span>
            <span className="text-xs font-normal text-neutral-400 font-sans">
              (Opt: {spec.optimalTempMin}° - {spec.optimalTempMax}°)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {batch.currentTemp > spec.criticalTempMax ? (
              <span className="text-rose-400 font-semibold">⚠️ Exceeds critical ceiling</span>
            ) : batch.currentTemp > spec.optimalTempMax ? (
              <span className="text-amber-400 font-medium">Elevated above target</span>
            ) : (
              <span className="text-emerald-400 font-medium">✓ Nominal cold-chain</span>
            )}
          </div>
        </div>

        {/* Gauge 2: Relative Humidity */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Rel. Humidity
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">{spec.category}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 flex items-baseline gap-2">
            <span>{batch.currentHumidity}%</span>
            <span className="text-xs font-normal text-neutral-400 font-sans">
              (Target: {spec.optimalHumidityMin}%+)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {batch.currentHumidity < spec.optimalHumidityMin ? (
              <span className="text-amber-400 font-medium">Dehydration risk active</span>
            ) : (
              <span className="text-emerald-400 font-medium">✓ Optimal hydration</span>
            )}
          </div>
        </div>

        {/* Gauge 3: Remaining Shelf Life */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Remaining Shelf Life
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">{pctRemaining.toFixed(0)}% Left</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 flex items-baseline gap-2">
            <span>{batch.remainingShelfLifeDays} d</span>
            <span className="text-xs font-normal text-neutral-400 font-sans">
              / {batch.initialShelfLifeDays}d baseline
            </span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-1.5 mt-3 overflow-hidden border border-neutral-800">
            <div
              className={`h-full rounded-full ${
                batch.status === 'Critical' ? 'bg-rose-500' : batch.status === 'At Risk' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${pctRemaining}%` }}
            />
          </div>
        </div>

        {/* Gauge 4: Dynamic Liquidation Recommendation */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Dynamic Discount
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">Urgency: {batch.urgencyScore}/100</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 flex items-baseline gap-2">
            <span className={batch.recommendedDiscountPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {batch.recommendedDiscountPercent}% OFF
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {batch.liquidationOffer?.status === 'Accepted' ? (
              <span className="text-emerald-400 font-semibold">✓ Offer Dispatched to Retailer</span>
            ) : batch.recommendedDiscountPercent > 0 ? (
              <span className="text-amber-400 font-medium">Liquidation recommended</span>
            ) : (
              <span className="text-neutral-400 font-medium">Standard supply chain</span>
            )}
          </div>
        </div>
      </div>

      {/* Transit Route & Checkpoint Visualizer */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
        <div className="flex items-center justify-between mb-3 text-xs text-neutral-400">
          <span className="font-semibold flex items-center gap-1.5 text-neutral-300">
            <Truck className="w-4 h-4 text-amber-400" />
            Transit Corridor & Telemetry Waypoints
          </span>
          <span className="font-mono text-neutral-400">
            Carrier: {batch.carrier} | Progress: {batch.transitProgressPercent}%
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-t border-b border-neutral-800/80 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-neutral-400 block text-[10px]">ORIGIN</span>
              <span className="font-bold text-neutral-200">{batch.origin}</span>
            </div>
          </div>

          <div className="flex-1 w-full sm:mx-4">
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono mb-1">
              <span>Elapsed: {batch.elapsedTransitHours}h</span>
              <span className="text-amber-400 font-bold">📍 {batch.currentLocation}</span>
              <span>Total ETA: {batch.totalExpectedTransitHours}h</span>
            </div>
            <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-blue-500 rounded-full"
                style={{ width: `${batch.transitProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-neutral-400 block text-[10px]">DESTINATION</span>
              <span className="font-bold text-neutral-200">{batch.destination}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-neutral-100 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50'
          }`}
        >
          Telemetry Charts & Historical Trends
        </button>
        <button
          onClick={() => setActiveTab('model')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'model'
              ? 'bg-neutral-100 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50'
          }`}
        >
          Explainable Degradation Model & What-If
        </button>
        <button
          onClick={() => setActiveTab('liquidation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'liquidation'
              ? 'bg-neutral-100 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50'
          }`}
        >
          Dynamic Liquidation & Retail Dispatch
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'logs'
              ? 'bg-neutral-100 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/50'
          }`}
        >
          Sensor Data Logs ({batch.telemetryHistory.length})
        </button>
      </div>

      {/* Tab 1: Telemetry Trends & Charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <TelemetryChart telemetry={batch.telemetryHistory} spec={spec} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DegradationModelCard
              spec={spec}
              currentTemp={batch.currentTemp}
              currentHumidity={batch.currentHumidity}
              remainingShelfLifeDays={batch.remainingShelfLifeDays}
            />
            <LiquidationCard
              batch={batch}
              spec={spec}
              retailers={retailers}
              onDispatchLiquidation={onDispatchLiquidation}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Explainable Degradation Model Studio */}
      {activeTab === 'model' && (
        <div className="space-y-6">
          <DegradationModelCard
            spec={spec}
            currentTemp={batch.currentTemp}
            currentHumidity={batch.currentHumidity}
            remainingShelfLifeDays={batch.remainingShelfLifeDays}
            onInjectWhatIf={async (simTemp, simHum) => {
              // Ingest new telemetry with the simulated what-if parameters
              await fetch(`/api/batches/${batch.id}/telemetry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temperature: simTemp, humidity: simHum })
              });
              await onRefresh();
            }}
          />
        </div>
      )}

      {/* Tab 3: Liquidation Dispatch */}
      {activeTab === 'liquidation' && (
        <div className="space-y-6">
          <LiquidationCard
            batch={batch}
            spec={spec}
            retailers={retailers}
            onDispatchLiquidation={onDispatchLiquidation}
          />
        </div>
      )}

      {/* Tab 4: Telemetry Event Log Table */}
      {activeTab === 'logs' && (
        <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Simulated IoT Telemetry Ingestion Audit Log</h3>
              <p className="text-xs text-neutral-400">Timestamped sensor stream with calculated kinetic degradation parameters</p>
            </div>
            <button
              onClick={exportTelemetryCsv}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Transit Hour</th>
                  <th className="py-2.5 px-3">Temp (°C)</th>
                  <th className="py-2.5 px-3">Humidity (%)</th>
                  <th className="py-2.5 px-3">Thermal Mult.</th>
                  <th className="py-2.5 px-3">Humid Mult.</th>
                  <th className="py-2.5 px-3">Aging Velocity</th>
                  <th className="py-2.5 px-3">RSL (Days)</th>
                  <th className="py-2.5 px-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                {batch.telemetryHistory.slice().reverse().map((point) => (
                  <tr key={point.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-neutral-400">
                      {new Date(point.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-200">+{point.transitDurationHours}h</td>
                    <td className={`py-2.5 px-3 font-bold ${
                      point.temperature > spec.criticalTempMax ? 'text-rose-400' :
                      point.temperature > spec.optimalTempMax ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {point.temperature.toFixed(1)}°C
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">{point.humidity}%</td>
                    <td className="py-2.5 px-3 text-neutral-400">{point.tempAgingFactor}x</td>
                    <td className="py-2.5 px-3 text-neutral-400">{point.humidityAgingFactor}x</td>
                    <td className={`py-2.5 px-3 font-semibold ${point.combinedAgingFactor > 1.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {point.combinedAgingFactor}x
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">{point.remainingShelfLifeDays}d</td>
                    <td className="py-2.5 px-3 text-neutral-400 font-sans truncate max-w-[180px]">{point.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
