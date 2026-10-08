import React, { useState } from 'react';
import { ProductSpec, BatchStatus } from '../types';
import { calculateLocalAgingFactors } from '../utils/degradationModel';
import { Zap, HelpCircle, Thermometer, Droplets, RotateCcw, Activity } from 'lucide-react';

interface DegradationModelCardProps {
  spec: ProductSpec;
  currentTemp: number;
  currentHumidity: number;
  remainingShelfLifeDays: number;
  onInjectWhatIf?: (temp: number, humidity: number) => void;
}

export const DegradationModelCard: React.FC<DegradationModelCardProps> = ({
  spec,
  currentTemp,
  currentHumidity,
  remainingShelfLifeDays,
  onInjectWhatIf
}) => {
  const [simTemp, setSimTemp] = useState<number>(currentTemp);
  const [simHum, setSimHum] = useState<number>(currentHumidity);
  const [isWhatIfActive, setIsWhatIfActive] = useState<boolean>(false);

  // Active inputs
  const activeTemp = isWhatIfActive ? simTemp : currentTemp;
  const activeHum = isWhatIfActive ? simHum : currentHumidity;

  const calculation = calculateLocalAgingFactors(activeTemp, activeHum, spec);

  const deltaTemp = Math.max(0, activeTemp - spec.optimalTempMax);
  const deltaHum = Math.max(0, spec.optimalHumidityMin - activeHum);

  // Projected hours until spoilage under current conditions
  const projectedRemainingHours = calculation.combinedAgingFactor > 0
    ? (remainingShelfLifeDays * 24) / calculation.combinedAgingFactor
    : remainingShelfLifeDays * 24;
  const projectedRemainingDays = (projectedRemainingHours / 24).toFixed(1);

  return (
    <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-neutral-100">
              Explainable Degradation Model (Kinetic Arrhenius & VPD)
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic biochemical decay rate based on commodity physiological constants (Zero black box)
          </p>
        </div>

        <button
          onClick={() => {
            setIsWhatIfActive(!isWhatIfActive);
            setSimTemp(currentTemp);
            setSimHum(currentHumidity);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all self-start sm:self-auto ${
            isWhatIfActive
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {isWhatIfActive ? 'What-If Sandbox Active' : 'Launch What-If Simulator'}
        </button>
      </div>

      {/* Interactive What-If Slider Controls if active */}
      {isWhatIfActive && (
        <div className="mb-6 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              Interactive Simulation Playground
            </span>
            <button
              onClick={() => {
                setSimTemp(currentTemp);
                setSimHum(currentHumidity);
              }}
              className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Current Sensors
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temp Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-blue-400" /> Simulated Temp:
                </span>
                <span className="font-mono font-bold text-blue-300">{simTemp.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min={-2}
                max={14}
                step={0.2}
                value={simTemp}
                onChange={e => setSimTemp(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>-2.0°C (Freezer)</span>
                <span>Opt: {spec.optimalTempMin}-{spec.optimalTempMax}°C</span>
                <span>14.0°C (Ambient)</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Simulated Relative Humidity:
                </span>
                <span className="font-mono font-bold text-cyan-300">{simHum}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                step={1}
                value={simHum}
                onChange={e => setSimHum(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>40% (Arid)</span>
                <span>Opt: {spec.optimalHumidityMin}-{spec.optimalHumidityMax}%</span>
                <span>100% (Saturated)</span>
              </div>
            </div>
          </div>

          {onInjectWhatIf && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => onInjectWhatIf(simTemp, simHum)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md"
              >
                Transmit Simulated Telemetry to Telemetry Feed
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formula & Degradation Velocity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Thermal Acceleration Factor */}
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Thermal Factor (AF_temp)</span>
              <span className="text-blue-400 font-mono">Q10 = {spec.q10Factor}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-100 flex items-baseline gap-1.5">
              <span>{calculation.tempAgingFactor}x</span>
              <span className="text-xs text-neutral-400 font-normal">rate</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono leading-relaxed">
            {deltaTemp > 0 ? (
              <>
                Q10^({deltaTemp.toFixed(1)}°C / 10) = <span className="text-amber-400">{calculation.tempAgingFactor}x</span>
              </>
            ) : (
              <span className="text-emerald-400">Optimal (Within safe corridor)</span>
            )}
          </div>
        </div>

        {/* Humidity Stress Factor */}
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Moisture Loss (AF_hum)</span>
              <span className="text-cyan-400 font-mono">α = {spec.humiditySensitivity}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-100 flex items-baseline gap-1.5">
              <span>{calculation.humidityAgingFactor}x</span>
              <span className="text-xs text-neutral-400 font-normal">multiplier</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-mono leading-relaxed">
            {deltaHum > 0 ? (
              <>
                1 + ({deltaHum}% × {spec.humiditySensitivity}) = <span className="text-amber-400">{calculation.humidityAgingFactor}x</span>
              </>
            ) : (
              <span className="text-emerald-400">Hydration in equilibrium</span>
            )}
          </div>
        </div>

        {/* Combined Aging Velocity */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950/90 to-purple-950/20 border border-purple-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Effective Velocity (V_aging)</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                calculation.combinedAgingFactor > 2.0 ? 'bg-rose-500/20 text-rose-300' :
                calculation.combinedAgingFactor > 1.3 ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                {calculation.status}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300 flex items-baseline gap-1.5">
              <span>{calculation.combinedAgingFactor}x</span>
              <span className="text-xs text-neutral-400 font-normal">nominal speed</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 text-[11px] text-neutral-300">
            1 hr elapsed = <span className="font-mono font-semibold text-purple-300">{calculation.combinedAgingFactor} hrs</span> shelf life lost
          </div>
        </div>
      </div>

      {/* Dynamic Mathematical Step-by-Step Breakdown */}
      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            Deterministic Formulation & Step-by-Step Evaluation
          </span>
          <span className="font-mono text-neutral-500 text-[11px]">ISO 22000 / Cold-Chain Kinetics</span>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 font-mono text-xs text-neutral-300 space-y-1.5">
          <div className="text-emerald-400 font-semibold">
            Formula: V_aging = AF_temp × AF_hum
          </div>
          <div className="text-neutral-400 text-[11px]">
            1. Temperature: AF_temp = {spec.q10Factor}^(({activeTemp.toFixed(1)} - {spec.optimalTempMax}) / 10) = <span className="text-neutral-200">{calculation.tempAgingFactor}</span>
          </div>
          <div className="text-neutral-400 text-[11px]">
            2. Relative Humidity: AF_hum = 1 + ({spec.humiditySensitivity} × max(0, {spec.optimalHumidityMin} - {activeHum})) = <span className="text-neutral-200">{calculation.humidityAgingFactor}</span>
          </div>
          <div className="text-purple-300 font-semibold text-[11px] pt-1 border-t border-neutral-800">
            3. Combined Aging Rate = {calculation.tempAgingFactor} × {calculation.humidityAgingFactor} = <span className="text-purple-400">{calculation.combinedAgingFactor}x nominal speed</span>
          </div>
        </div>

        <p className="text-xs text-neutral-400 italic">
          {calculation.explanation.summary} At current rate, remaining product viability is projected to exhaust in approximately <strong className="text-neutral-200">{projectedRemainingDays} days</strong> ({projectedRemainingHours.toFixed(0)} hours).
        </p>
      </div>
    </div>
  );
};
