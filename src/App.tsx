import React, { useState, useEffect, useRef } from 'react';
import { Batch, Alert, Retailer, ProductSpec, DashboardStats } from './types';
import { api } from './utils/api';
import { Navbar } from './components/Navbar';
import { KpiBar } from './components/KpiBar';
import { BatchCard } from './components/BatchCard';
import { BatchDetailsView } from './components/BatchDetailsView';
import { LiquidationExchange } from './components/LiquidationExchange';
import { AlertsCenter } from './components/AlertsCenter';
import { ModelExplainerModal } from './components/ModelExplainerModal';
import { NewBatchModal } from './components/NewBatchModal';
import {
  Search,
  Filter,
  Grid,
  List,
  RefreshCw,
  Plus,
  AlertCircle,
  Truck,
  Activity,
  CheckCircle2,
  Zap
} from 'lucide-react';

export const App: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    healthy: 0,
    atRisk: 0,
    critical: 0,
    expired: 0,
    totalValueAtRisk: 0,
    totalSalvagedRevenue: 0,
    totalFoodSavedKg: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [specs, setSpecs] = useState<Record<string, ProductSpec>>({});
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'details' | 'liquidation' | 'alerts'>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showNewBatchModal, setShowNewBatchModal] = useState<boolean>(false);
  const [showExplainerModal, setShowExplainerModal] = useState<boolean>(false);

  const simulationTimerRef = useRef<number | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setError(null);
      const [batchRes, alertRes, retailerRes, specRes] = await Promise.all([
        api.getBatches({ status: statusFilter, category: categoryFilter, search: searchQuery }),
        api.getAlerts(),
        api.getRetailers(),
        api.getSpecs()
      ]);
      setBatches(batchRes.batches);
      setStats(batchRes.stats);
      setAlerts(alertRes);
      setRetailers(retailerRes);
      setSpecs(specRes);

      // Keep selectedBatch in sync if open
      if (selectedBatch) {
        const updated = batchRes.batches.find(b => b.id === selectedBatch.id);
        if (updated) setSelectedBatch(updated);
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setError((err as Error).message || 'Failed to connect to AgroSense services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter, searchQuery]);

  // Live Simulation Heartbeat
  useEffect(() => {
    if (isSimulating) {
      simulationTimerRef.current = window.setInterval(async () => {
        try {
          await api.simulateTick();
          // Silently refresh batches and stats
          const [batchRes, alertRes] = await Promise.all([
            api.getBatches({ status: statusFilter, category: categoryFilter, search: searchQuery }),
            api.getAlerts()
          ]);
          setBatches(batchRes.batches);
          setStats(batchRes.stats);
          setAlerts(alertRes);

          if (selectedBatch) {
            const updated = batchRes.batches.find(b => b.id === selectedBatch.id);
            if (updated) setSelectedBatch(updated);
          }
        } catch (err) {
          console.error('Simulation tick error:', err);
        }
      }, 4000);
    } else {
      if (simulationTimerRef.current !== null) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    }

    return () => {
      if (simulationTimerRef.current !== null) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isSimulating, statusFilter, categoryFilter, searchQuery, selectedBatch]);

  const handleManualTick = async () => {
    try {
      await api.simulateTick();
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to step simulation');
    }
  };

  const handleResetData = async () => {
    try {
      setIsLoading(true);
      await api.resetDatabase();
      await fetchData();
      setSelectedBatch(null);
      setCurrentTab('dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reset simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentTab('details');
  };

  const handleInjectBreach = async (batchId: string, type: 'temp_high' | 'humidity_drop' | 'restore' = 'temp_high') => {
    try {
      await api.injectBreach(batchId, type);
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to inject excursion breach');
    }
  };

  const handleDispatchLiquidation = async (batchId: string, retailerId: string, discount: number) => {
    try {
      await api.acceptLiquidation(batchId, { retailerId, discountPercent: discount });
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to dispatch liquidation offer');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId);
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to resolve alert');
    }
  };

  const handleCreateBatch = async (payload: {
    productKey: string;
    quantityKg: number;
    origin: string;
    destination: string;
    carrier: string;
    initialTemp?: number;
    initialHumidity?: number;
    totalExpectedTransitHours?: number;
  }) => {
    const created = await api.createBatch(payload);
    await fetchData();
    handleSelectBatch(created);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        selectedBatchName={selectedBatch?.productName}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onManualTick={handleManualTick}
        onResetData={handleResetData}
        onOpenNewBatch={() => setShowNewBatchModal(true)}
        onOpenExplainer={() => setShowExplainerModal(true)}
        alertCount={alerts.filter(a => !a.resolved).length}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification Banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-100 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Global KPI Summary Bar */}
        <KpiBar
          stats={stats}
          selectedStatusFilter={statusFilter}
          onFilterChange={s => setStatusFilter(s)}
        />

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Filters & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by SKU, product, carrier, location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Berries">Berries</option>
                  <option value="Seafood">Seafood</option>
                  <option value="Exotic Fruits">Exotic Fruits</option>
                  <option value="Leafy Greens">Leafy Greens</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Meat">Meat</option>
                </select>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      viewMode === 'table' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={fetchData}
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  title="Refresh Shipments"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Batch List / Grid Content */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 rounded-2xl bg-neutral-900/40 border border-neutral-800 animate-pulse p-5 space-y-4">
                    <div className="h-4 bg-neutral-800 rounded w-1/3" />
                    <div className="h-6 bg-neutral-800 rounded w-2/3" />
                    <div className="h-20 bg-neutral-800/60 rounded-xl" />
                    <div className="h-3 bg-neutral-800 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-20 bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8">
                <Truck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-neutral-200">No shipments found</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-6">
                  {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                    ? 'Try clearing the search query or status filter to see other shipments.'
                    : 'Get started by creating a new perishable shipment or resetting the demo data.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setStatusFilter('All');
                      setCategoryFilter('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setShowNewBatchModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-neutral-950"
                  >
                    Create Shipment
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {batches.map(batch => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    spec={specs[batch.productKey]}
                    onSelect={handleSelectBatch}
                    onInjectBreach={id => handleInjectBreach(id, 'temp_high')}
                  />
                ))}
              </div>
            ) : (
              /* Table View */
              <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-4 overflow-x-auto shadow-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-3">Batch ID / Product</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Temp</th>
                      <th className="py-3 px-3">Humidity</th>
                      <th className="py-3 px-3">RSL (Days)</th>
                      <th className="py-3 px-3">Velocity</th>
                      <th className="py-3 px-3">Discount</th>
                      <th className="py-3 px-3">Location / Carrier</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                    {batches.map(batch => (
                      <tr
                        key={batch.id}
                        onClick={() => handleSelectBatch(batch)}
                        className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-amber-400 block">{batch.id}</span>
                          <span className="text-neutral-200 font-sans font-medium line-clamp-1">{batch.productName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            batch.status === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                            batch.status === 'At Risk' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-neutral-100">{batch.currentTemp.toFixed(1)}°C</td>
                        <td className="py-3 px-3 text-cyan-300">{batch.currentHumidity}%</td>
                        <td className="py-3 px-3 text-amber-400 font-bold">{batch.remainingShelfLifeDays}d</td>
                        <td className="py-3 px-3 text-neutral-400">{batch.currentAgingVelocity}x</td>
                        <td className="py-3 px-3">
                          {batch.recommendedDiscountPercent > 0 ? (
                            <span className="font-bold text-amber-400">{batch.recommendedDiscountPercent}% OFF</span>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans text-neutral-400 text-[11px] truncate max-w-[200px]">
                          {batch.currentLocation}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectBatch(batch);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BATCH DETAILS VIEW */}
        {currentTab === 'details' && selectedBatch && (
          <BatchDetailsView
            batch={selectedBatch}
            spec={specs[selectedBatch.productKey] || Object.values(specs)[0]}
            retailers={retailers}
            onBack={() => setCurrentTab('dashboard')}
            onInjectBreach={handleInjectBreach}
            onDispatchLiquidation={async (retailerId, discount) => {
              await handleDispatchLiquidation(selectedBatch.id, retailerId, discount);
            }}
            onRefresh={fetchData}
          />
        )}

        {/* TAB 3: LIQUIDATION EXCHANGE */}
        {currentTab === 'liquidation' && (
          <LiquidationExchange
            batches={batches}
            specs={specs}
            retailers={retailers}
            onSelectBatch={handleSelectBatch}
            onDispatchLiquidation={handleDispatchLiquidation}
          />
        )}

        {/* TAB 4: ALERTS CENTER */}
        {currentTab === 'alerts' && (
          <AlertsCenter
            alerts={alerts}
            batches={batches}
            onSelectBatch={handleSelectBatch}
            onResolveAlert={handleResolveAlert}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AgroSense Cold-Chain Intelligence Engine • 100% Software Simulated Telemetry</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Deterministic Arrhenius / VPD Decay Kinetics</span>
            <span>•</span>
            <button
              onClick={() => setShowExplainerModal(true)}
              className="text-amber-400 hover:underline"
            >
              Degradation Science Reference
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showNewBatchModal && (
        <NewBatchModal
          specs={specs}
          onClose={() => setShowNewBatchModal(false)}
          onCreate={handleCreateBatch}
        />
      )}

      {showExplainerModal && (
        <ModelExplainerModal onClose={() => setShowExplainerModal(false)} />
      )}
    </div>
  );
};
