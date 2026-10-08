import React from 'react';
import { Batch, ProductSpec } from '../types';
import { getStatusColor, formatCurrency } from '../utils/degradationModel';
import { Thermometer, Droplets, Clock, Tag, ArrowRight, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface BatchCardProps {
  batch: Batch;
  spec?: ProductSpec;
  onSelect: (batch: Batch) => void;
  onInjectBreach: (batchId: string) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  spec,
  onSelect,
  onInjectBreach
}) => {
  const statusColors = getStatusColor(batch.status);
  const baselineDays = batch.initialShelfLifeDays || 7;
  const pctRemaining = Math.max(0, Math.min(100, batch.remainingShelfLifePercent));

  const isTempAboveOpt = spec && batch.currentTemp > spec.optimalTempMax;
  const isTempCritical = spec && batch.currentTemp > spec.criticalTempMax;

  return (
    <div
      onClick={() => onSelect(batch)}
      className="group bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-0.5 flex flex-col justify-between"
    >
      <div>
        {/* Header: Batch ID & Status Pill */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-neutral-400 group-hover:text-amber-400 transition-colors">
                {batch.id}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                {batch.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-neutral-100 mt-1 line-clamp-1 group-hover:text-white">
              {batch.productName}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors.badge}`}>
              <span className={`w-2 h-2 rounded-full ${statusColors.dot} ${batch.status === 'Critical' ? 'animate-ping' : ''}`} />
              {batch.status}
            </span>
            {batch.recommendedDiscountPercent > 0 && (
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {batch.recommendedDiscountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Location & Carrier */}
        <div className="text-xs text-neutral-400 mb-4 flex items-center justify-between">
          <span className="truncate max-w-[200px]">📍 {batch.currentLocation}</span>
          <span className="text-[11px] text-neutral-500 font-mono">{batch.carrier.split(' ')[0]}</span>
        </div>

        {/* Live Gauges (Temperature, Humidity, Aging Multiplier) */}
        <div className="grid grid-cols-3 gap-2.5 mb-4 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
          {/* Temperature */}
          <div>
            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mb-0.5">
              <Thermometer className="w-3 h-3 text-blue-400" /> Temp
            </span>
            <div className={`text-sm font-bold font-mono ${
              isTempCritical ? 'text-rose-400' : isTempAboveOpt ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {batch.currentTemp.toFixed(1)}°C
            </div>
            {spec && (
              <span className="text-[9px] text-neutral-400">
                Opt: {spec.optimalTempMin}-{spec.optimalTempMax}°
              </span>
            )}
          </div>

          {/* Humidity */}
          <div>
            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mb-0.5">
              <Droplets className="w-3 h-3 text-cyan-400" /> Humidity
            </span>
            <div className="text-sm font-bold font-mono text-cyan-300">
              {batch.currentHumidity}%
            </div>
            {spec && (
              <span className="text-[9px] text-neutral-400">
                Opt: {spec.optimalHumidityMin}%+
              </span>
            )}
          </div>

          {/* Aging Velocity */}
          <div>
            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3 text-purple-400" /> Velocity
            </span>
            <div className={`text-sm font-bold font-mono ${
              batch.currentAgingVelocity > 1.8 ? 'text-rose-400' : batch.currentAgingVelocity > 1.2 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {batch.currentAgingVelocity}x
            </div>
            <span className="text-[9px] text-neutral-400">
              {batch.currentAgingVelocity > 1.2 ? 'Accelerated' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Shelf Life Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" /> Remaining Shelf Life:
            </span>
            <span className="font-mono font-bold text-neutral-200">
              {batch.remainingShelfLifeDays} days <span className="text-neutral-400 font-normal">({pctRemaining.toFixed(0)}%)</span>
            </span>
          </div>
          <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                batch.status === 'Critical'
                  ? 'bg-rose-500'
                  : batch.status === 'At Risk'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${pctRemaining}%` }}
            />
          </div>
        </div>

        {/* Breach Alert Pill if any */}
        {batch.hasBreach && (
          <div className="mb-4 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 text-[11px] text-amber-200/90 leading-snug">
              {batch.breachDescription || 'Environmental excursion registered in transit history.'}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer: Quantity, Transit Progress, & Action CTA */}
      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-neutral-400 block text-[10px]">Lot Quantity</span>
          <span className="font-mono font-semibold text-neutral-300">{batch.quantityKg} kg</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInjectBreach(batch.id);
            }}
            title="Inject simulated thermal excursion"
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-amber-400 transition-colors text-xs flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelect(batch)}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 group-hover:bg-amber-500 group-hover:text-neutral-950 text-neutral-200 text-xs font-semibold transition-all flex items-center gap-1"
          >
            Details
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
