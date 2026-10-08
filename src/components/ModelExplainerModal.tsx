import React from 'react';
import { X, Activity, BookOpen, Calculator, ShieldCheck, TrendingDown } from 'lucide-react';

interface ModelExplainerModalProps {
  onClose: () => void;
}

export const ModelExplainerModal: React.FC<ModelExplainerModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2 text-emerald-400 font-mono text-xs uppercase tracking-widest">
          <BookOpen className="w-4 h-4" /> AgroSense Technical Reference
        </div>

        <h2 className="text-2xl font-extrabold text-neutral-100 mb-2">
          Explainable Kinetic Degradation & Dynamic Pricing Model
        </h2>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          How AgroSense converts raw cold-chain environmental telemetry into biochemical shelf-life consumption and automated liquidation pricing without black-box opacity.
        </p>

        <div className="space-y-6 text-xs text-neutral-300">
          {/* Section 1: Temperature Arrhenius Q10 */}
          <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Activity className="w-4 h-4" />
              1. Kinetic Thermal Acceleration Factor (Arrhenius Q10)
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Enzymatic respiration and microbial proliferation in perishable foodstuffs double to triple for every 10°C increase above optimal holding temperature.
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-blue-300">
              AF_temp = (Q_10) ^ ((T_actual - T_opt_max) / 10)
            </div>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1 text-[11px]">
              <li><strong className="text-neutral-200">Q_10 factor:</strong> 2.2 to 3.2 based on commodity respiration rate (Strawberries: 2.8, Salmon: 3.2, Avocados: 2.2).</li>
              <li><strong className="text-neutral-200">Thermal Excursion Penalty:</strong> When temperature breaches critical spoilage limit (T_crit), a non-linear compounding factor is applied: <code className="text-amber-300">AF_temp × (1 + 0.20 × (T_actual - T_crit))</code>.</li>
            </ul>
          </div>

          {/* Section 2: Humidity Transpiration */}
          <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Calculator className="w-4 h-4" />
              2. Moisture Deficit & Transpiration Loss Factor (VPD)
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Produce loses turgidity and cellular water when ambient relative humidity drops below product vapor pressure equilibrium, causing wilting, shriveling, and weight loss.
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-cyan-300">
              AF_hum = 1.0 + (α × max(0, RH_opt_min - RH_actual))
            </div>
            <p className="text-neutral-400 text-[11px]">
              Where <strong className="text-neutral-200">α (humidity sensitivity)</strong> ranges between 0.02 and 0.05 per percentage point deficit. When saturation exceeds 98%, free water condensation triggers a mold risk multiplier.
            </p>
          </div>

          {/* Section 3: Cumulative Degradation & Shelf Life */}
          <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <TrendingDown className="w-4 h-4" />
              3. Cumulative Aging Velocity & Remaining Useful Shelf Life (RSL)
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-purple-300">
              V_aging = AF_temp × AF_hum
              <br />
              Aging_Days_Consumed = Σ (Δt_hours / 24) × V_aging
              <br />
              RSL (Days) = max(0, Baseline_Days - Aging_Days_Consumed)
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Example: If a shipment of salmon with baseline 5-day shelf life experiences 12 hours of refrigeration failure at 4.5°C (velocity 2.8x), it loses <span className="text-rose-400 font-semibold font-mono">1.4 days</span> of shelf life in just half a day of calendar time.
            </p>
          </div>

          {/* Section 4: Dynamic Liquidation Pricing */}
          <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              4. Automated Dynamic Liquidation Discount Curve
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Instead of discarding products at destination or letting them spoil on retail shelves, AgroSense automatically matches batches with nearby local grocery liquidators based on Remaining Hours to Spoilage:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-emerald-400 font-bold block">&gt; 72 Hours</span>
                <span className="text-neutral-400">0% - 15% OFF (Standard)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-amber-400 font-bold block">48 - 72 Hours</span>
                <span className="text-neutral-400">25% - 40% OFF (Proactive)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-orange-400 font-bold block">24 - 48 Hours</span>
                <span className="text-neutral-400">45% - 65% OFF (Urgent)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-rose-400 font-bold block">&lt; 24 Hours</span>
                <span className="text-neutral-400">70% - 85% OFF (Flash Rescue)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
