import React from 'react';
import { DashboardStats } from '../types';
import { formatCurrency } from '../utils/degradationModel';
import { ShieldCheck, AlertTriangle, Flame, DollarSign, TrendingUp, Leaf, Package } from 'lucide-react';

interface KpiBarProps {
  stats: DashboardStats;
  selectedStatusFilter: string;
  onFilterChange: (status: string) => void;
}

export const KpiBar: React.FC<KpiBarProps> = ({
  stats,
  selectedStatusFilter,
  onFilterChange
}) => {
  const complianceRate = stats.total > 0
    ? Math.round((stats.healthy / stats.total) * 100)
    : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Batches */}
      <button
        onClick={() => onFilterChange('All')}
        className={`p-4 rounded-2xl border text-left transition-all ${
          selectedStatusFilter === 'All'
            ? 'bg-neutral-800 border-neutral-600 shadow-md'
            : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span>Active Fleet</span>
          <Package className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-100">
          {stats.total}
        </div>
        <span className="text-[10px] text-neutral-500 mt-0.5 block">
          Simulated IoT Units
        </span>
      </button>

      {/* 2. Healthy Batches */}
      <button
        onClick={() => onFilterChange('Healthy')}
        className={`p-4 rounded-2xl border text-left transition-all ${
          selectedStatusFilter === 'Healthy'
            ? 'bg-emerald-950/60 border-emerald-500 shadow-md'
            : 'bg-neutral-900/70 border-neutral-800 hover:border-emerald-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
          <span>Cold Compliant</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-300">
          {stats.healthy}
        </div>
        <span className="text-[10px] text-emerald-500/80 mt-0.5 block">
          {complianceRate}% within optimal spec
        </span>
      </button>

      {/* 3. At Risk Batches */}
      <button
        onClick={() => onFilterChange('At Risk')}
        className={`p-4 rounded-2xl border text-left transition-all ${
          selectedStatusFilter === 'At Risk'
            ? 'bg-amber-950/60 border-amber-500 shadow-md'
            : 'bg-neutral-900/70 border-neutral-800 hover:border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
          <span>At Risk</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-300">
          {stats.atRisk}
        </div>
        <span className="text-[10px] text-amber-500/80 mt-0.5 block">
          Elevated aging velocity
        </span>
      </button>

      {/* 4. Critical Batches */}
      <button
        onClick={() => onFilterChange('Critical')}
        className={`p-4 rounded-2xl border text-left transition-all ${
          selectedStatusFilter === 'Critical'
            ? 'bg-rose-950/60 border-rose-500 shadow-md'
            : 'bg-neutral-900/70 border-neutral-800 hover:border-rose-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
          <span>Critical Excursion</span>
          <Flame className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-rose-300">
          {stats.critical}
        </div>
        <span className="text-[10px] text-rose-500/80 mt-0.5 block">
          Urgent clearance required
        </span>
      </button>

      {/* 5. Inventory Value At Risk */}
      <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span>Value At Risk</span>
          <DollarSign className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold font-mono text-amber-300 truncate">
          {formatCurrency(stats.totalValueAtRisk)}
        </div>
        <span className="text-[10px] text-neutral-500 mt-0.5 block">
          In at-risk/critical lots
        </span>
      </div>

      {/* 6. Salvaged Revenue / ESG Impact */}
      <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800">
        <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
          <span>Salvaged Revenue</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-bold font-mono text-emerald-300 truncate">
          {formatCurrency(stats.totalSalvagedRevenue)}
        </div>
        <span className="text-[10px] text-emerald-500/80 mt-0.5 block truncate">
          {stats.totalFoodSavedKg.toLocaleString()} kg food rescued
        </span>
      </div>
    </div>
  );
};
