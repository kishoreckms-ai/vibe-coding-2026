import React, { useState } from 'react';
import { TelemetryPoint, ProductSpec } from '../types';

interface TelemetryChartProps {
  telemetry: TelemetryPoint[];
  spec: ProductSpec;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ telemetry, spec }) => {
  const [activeTab, setActiveTab] = useState<'temperature' | 'humidity' | 'shelflife'>('temperature');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-400 bg-neutral-900/60 rounded-xl border border-neutral-800">
        No telemetry logged yet for this shipment
      </div>
    );
  }

  const width = 680;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Compute Scales
  let yMin = 0;
  let yMax = 10;
  let values: number[] = [];
  let unit = '';

  if (activeTab === 'temperature') {
    values = telemetry.map(t => t.temperature);
    yMin = Math.min(-2, ...values, spec.optimalTempMin - 1);
    yMax = Math.max(10, ...values, spec.criticalTempMax + 2);
    unit = '°C';
  } else if (activeTab === 'humidity') {
    values = telemetry.map(t => t.humidity);
    yMin = Math.max(40, Math.min(...values, spec.optimalHumidityMin - 10));
    yMax = 100;
    unit = '%';
  } else {
    values = telemetry.map(t => t.remainingShelfLifeDays);
    yMin = 0;
    yMax = Math.max(spec.baselineShelfLifeDays, ...values) + 1;
    unit = ' days';
  }

  const getX = (index: number) => {
    if (telemetry.length === 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (telemetry.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return padding.top + (1 - ratio) * graphHeight;
  };

  // Build SVG Path
  const points = telemetry.map((t, i) => {
    const val = activeTab === 'temperature' ? t.temperature : activeTab === 'humidity' ? t.humidity : t.remainingShelfLifeDays;
    return `${getX(i)},${getY(val)}`;
  });
  const linePath = points.length > 1 ? `M ${points.join(' L ')}` : '';
  const areaPath = points.length > 1 ? `M ${points.join(' L ')} L ${getX(telemetry.length - 1)},${getY(yMin)} L ${getX(0)},${getY(yMin)} Z` : '';

  // Baseline line for shelf life
  const idealShelfLifePath = activeTab === 'shelflife' ? telemetry.map((t, i) => {
    const consumedNominal = (t.transitDurationHours / 24);
    const idealVal = Math.max(0, spec.baselineShelfLifeDays - consumedNominal);
    return `${getX(i)},${getY(idealVal)}`;
  }).join(' L ') : '';

  const hoveredPoint = hoverIndex !== null ? telemetry[hoverIndex] : null;

  return (
    <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-5 shadow-xl">
      {/* Chart Header & Tab Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            {activeTab === 'temperature' && 'Refrigeration Thermal Trace vs Danger Thresholds'}
            {activeTab === 'humidity' && 'Relative Humidity & Transpiration Monitoring'}
            {activeTab === 'shelflife' && 'Calculated Kinetic Shelf-Life Decay (Actual vs Nominal)'}
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            {telemetry.length} logged data points across {telemetry[telemetry.length - 1]?.transitDurationHours || 0} hours of transit
          </p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('temperature')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'temperature'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Temperature (°C)
          </button>
          <button
            onClick={() => setActiveTab('humidity')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'humidity'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Humidity (%)
          </button>
          <button
            onClick={() => setActiveTab('shelflife')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'shelflife'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Shelf-Life Decay
          </button>
        </div>
      </div>

      {/* Main SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-64 select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="shelfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + ratio * graphHeight;
            const val = yMax - ratio * (yMax - yMin);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#262626"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#737373"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono"
                >
                  {val.toFixed(activeTab === 'shelflife' ? 1 : 0)}
                  {unit}
                </text>
              </g>
            );
          })}

          {/* Reference Zones for Temperature */}
          {activeTab === 'temperature' && (
            <>
              {/* Optimal Green Corridor */}
              <rect
                x={padding.left}
                y={getY(spec.optimalTempMax)}
                width={graphWidth}
                height={Math.max(4, getY(spec.optimalTempMin) - getY(spec.optimalTempMax))}
                fill="#10b981"
                fillOpacity="0.12"
              />
              <line
                x1={padding.left}
                y1={getY(spec.optimalTempMax)}
                x2={width - padding.right}
                y2={getY(spec.optimalTempMax)}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text
                x={width - padding.right}
                y={getY(spec.optimalTempMax) - 4}
                fill="#10b981"
                fontSize="9"
                textAnchor="end"
                fontWeight="bold"
              >
                Safe Max ({spec.optimalTempMax}°C)
              </text>

              {/* Critical Red Danger Threshold */}
              <line
                x1={padding.left}
                y1={getY(spec.criticalTempMax)}
                x2={width - padding.right}
                y2={getY(spec.criticalTempMax)}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - padding.right}
                y={getY(spec.criticalTempMax) - 4}
                fill="#ef4444"
                fontSize="9"
                textAnchor="end"
                fontWeight="bold"
              >
                Critical Spoilage Ceiling ({spec.criticalTempMax}°C)
              </text>
            </>
          )}

          {/* Reference Zones for Humidity */}
          {activeTab === 'humidity' && (
            <>
              <rect
                x={padding.left}
                y={getY(spec.optimalHumidityMax)}
                width={graphWidth}
                height={Math.max(4, getY(spec.optimalHumidityMin) - getY(spec.optimalHumidityMax))}
                fill="#06b6d4"
                fillOpacity="0.12"
              />
              <line
                x1={padding.left}
                y1={getY(spec.optimalHumidityMin)}
                x2={width - padding.right}
                y2={getY(spec.optimalHumidityMin)}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <text
                x={width - padding.right}
                y={getY(spec.optimalHumidityMin) + 12}
                fill="#f59e0b"
                fontSize="9"
                textAnchor="end"
              >
                Wilting Floor ({spec.optimalHumidityMin}%)
              </text>
            </>
          )}

          {/* Nominal ideal line for Shelf Life */}
          {activeTab === 'shelflife' && idealShelfLifePath && (
            <path
              d={`M ${idealShelfLifePath}`}
              fill="none"
              stroke="#52525b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Area under curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill={
                activeTab === 'temperature'
                  ? 'url(#tempGradient)'
                  : activeTab === 'humidity'
                  ? 'url(#humGradient)'
                  : 'url(#shelfGradient)'
              }
            />
          )}

          {/* Telemetry Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={
                activeTab === 'temperature'
                  ? '#3b82f6'
                  : activeTab === 'humidity'
                  ? '#06b6d4'
                  : '#f59e0b'
              }
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Interactive Data Points & Hover Targets */}
          {telemetry.map((t, i) => {
            const val = activeTab === 'temperature' ? t.temperature : activeTab === 'humidity' ? t.humidity : t.remainingShelfLifeDays;
            const cx = getX(i);
            const cy = getY(val);
            const isHovered = hoverIndex === i;

            return (
              <g
                key={t.id || i}
                onMouseEnter={() => setHoverIndex(i)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <circle cx={cx} cy={cy} r="14" fill="transparent" />

                {/* Visible point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3.5}
                  fill={
                    activeTab === 'temperature'
                      ? t.temperature > spec.criticalTempMax
                        ? '#ef4444'
                        : t.temperature > spec.optimalTempMax
                        ? '#f59e0b'
                        : '#3b82f6'
                      : activeTab === 'humidity'
                      ? '#06b6d4'
                      : '#f59e0b'
                  }
                  stroke="#09090b"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {isHovered && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={height - padding.bottom}
                    stroke="#a3a3a3"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}

          {/* X Axis Labels */}
          {telemetry.map((t, i) => {
            // Show every few labels
            if (i === 0 || i === Math.floor(telemetry.length / 2) || i === telemetry.length - 1) {
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={height - 8}
                  fill="#737373"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono"
                >
                  +{t.transitDurationHours}h
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-4 bg-neutral-950/95 border border-neutral-700 p-2.5 rounded-lg shadow-2xl text-xs z-10 pointer-events-none min-w-[210px] backdrop-blur-md"
          >
            <div className="flex items-center justify-between font-mono text-neutral-400 border-b border-neutral-800 pb-1 mb-1.5">
              <span>Transit Hour +{hoveredPoint.transitDurationHours}h</span>
              <span className="text-neutral-500">{new Date(hoveredPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Temperature:</span>
                <span className={`font-mono font-semibold ${
                  hoveredPoint.temperature > spec.criticalTempMax ? 'text-rose-400' :
                  hoveredPoint.temperature > spec.optimalTempMax ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {hoveredPoint.temperature.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Rel. Humidity:</span>
                <span className="font-mono font-semibold text-cyan-400">{hoveredPoint.humidity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Aging Velocity:</span>
                <span className={`font-mono font-semibold ${hoveredPoint.combinedAgingFactor > 1.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {hoveredPoint.combinedAgingFactor}x nominal
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Remaining Shelf-Life:</span>
                <span className="font-mono font-semibold text-amber-400">{hoveredPoint.remainingShelfLifeDays} days</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1 truncate">
                📍 {hoveredPoint.location}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Explanations */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
        {activeTab === 'temperature' && (
          <>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50 inline-block"></span>
                Optimal Range ({spec.optimalTempMin}°C - {spec.optimalTempMax}°C)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
                Critical Thermal Ceiling ({spec.criticalTempMax}°C)
              </span>
            </div>
            <span className="text-neutral-500 italic">
              Kinetic degradation governed by Q10 temperature multiplier = {spec.q10Factor}
            </span>
          </>
        )}
        {activeTab === 'humidity' && (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/50 inline-block"></span>
              Target Humidity ({spec.optimalHumidityMin}% - {spec.optimalHumidityMax}%)
            </span>
            <span className="text-neutral-500">
              Sensitivity: +{(spec.humiditySensitivity * 100).toFixed(1)}% aging acceleration per % moisture deficit
            </span>
          </div>
        )}
        {activeTab === 'shelflife' && (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block"></span>
              Actual Remaining Useful Life (RUL)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-neutral-500 inline-block"></span>
              Nominal Baseline Decay Rate (Ideal 1.0x)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
