import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Plus,
  BookOpen,
  Tag,
  AlertTriangle,
  LayoutDashboard,
  FastForward,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'details' | 'liquidation' | 'alerts';
  onSelectTab: (tab: 'dashboard' | 'details' | 'liquidation' | 'alerts') => void;
  selectedBatchName?: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onManualTick: () => void;
  onResetData: () => void;
  onOpenNewBatch: () => void;
  onOpenExplainer: () => void;
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedBatchName,
  isSimulating,
  onToggleSimulation,
  onManualTick,
  onResetData,
  onOpenNewBatch,
  onOpenExplainer,
  alertCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 text-neutral-950 shadow-lg shadow-emerald-500/20 font-black text-xl">
              <Activity className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">AgroSense</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Cold-Chain OS
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 hidden sm:block">
                Kinetic Shelf-Life Intelligence & Dynamic Retail Liquidation
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/80 p-1 rounded-2xl border border-neutral-800">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>

            {selectedBatchName && (
              <button
                onClick={() => onSelectTab('details')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'details'
                    ? 'bg-neutral-800 text-amber-300 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Batch Deep Dive
              </button>
            )}

            <button
              onClick={() => onSelectTab('liquidation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'liquidation'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Liquidation Hub
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                currentTab === 'alerts'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Alerts
              {alertCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-neutral-950 font-bold text-[9px] flex items-center justify-center font-mono">
                  {alertCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right: Simulation Controls & Actions */}
          <div className="flex items-center gap-2">
            {/* Live Simulation Pulse Controller */}
            <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-1">
              <button
                onClick={onToggleSimulation}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSimulating
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title={isSimulating ? 'Pause automatic telemetry pulse' : 'Start automatic telemetry pulse (4s interval)'}
              >
                {isSimulating ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-neutral-950 animate-ping" />
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Pulse: ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Auto Sim</span>
                  </>
                )}
              </button>

              <button
                onClick={onManualTick}
                className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Advance simulation by +1.5 transit hours"
              >
                <FastForward className="w-4 h-4" />
              </button>

              <button
                onClick={onResetData}
                className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                title="Reset database to realistic seed state"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Model Explainer Button */}
            <button
              onClick={onOpenExplainer}
              className="p-2 rounded-2xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="View Degradation Science & Equations"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </button>

            {/* New Batch Button */}
            <button
              onClick={onOpenNewBatch}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">New Shipment</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-neutral-800/60 text-xs">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1 rounded-lg ${currentTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
          >
            Overview
          </button>
          {selectedBatchName && (
            <button
              onClick={() => onSelectTab('details')}
              className={`px-3 py-1 rounded-lg ${currentTab === 'details' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
            >
              Batch Details
            </button>
          )}
          <button
            onClick={() => onSelectTab('liquidation')}
            className={`px-3 py-1 rounded-lg ${currentTab === 'liquidation' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
          >
            Liquidation
          </button>
          <button
            onClick={() => onSelectTab('alerts')}
            className={`px-3 py-1 rounded-lg ${currentTab === 'alerts' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
          >
            Alerts ({alertCount})
          </button>
        </div>
      </div>
    </header>
  );
};
