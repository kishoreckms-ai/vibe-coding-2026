import React, { useState } from 'react';
import { Batch, ProductSpec, Retailer } from '../types';
import { formatCurrency, getStatusColor } from '../utils/degradationModel';
import { Tag, TrendingUp, AlertTriangle, CheckCircle2, Truck, ArrowRight, ShieldCheck, Leaf } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiquidationExchangeProps {
  batches: Batch[];
  specs: Record<string, ProductSpec>;
  retailers: Retailer[];
  onSelectBatch: (batch: Batch) => void;
  onDispatchLiquidation: (batchId: string, retailerId: string, discount: number) => Promise<void>;
}

export const LiquidationExchange: React.FC<LiquidationExchangeProps> = ({
  batches,
  specs,
  retailers,
  onSelectBatch,
  onDispatchLiquidation
}) => {
  const [filterUrgency, setFilterUrgency] = useState<'All' | 'Immediate' | 'Pending' | 'Accepted'>('All');
  const [selectedRetailerMap, setSelectedRetailerMap] = useState<Record<string, string>>({});

  // Filter batches with discount > 0 or at risk/critical
  const discountableBatches = batches.filter(b => b.recommendedDiscountPercent > 0 || b.status === 'At Risk' || b.status === 'Critical');

  const filtered = discountableBatches.filter(b => {
    if (filterUrgency === 'Immediate') return b.urgencyScore > 75 && b.liquidationOffer?.status !== 'Accepted';
    if (filterUrgency === 'Pending') return b.liquidationOffer?.status === 'Pending' || (!b.liquidationOffer && b.recommendedDiscountPercent > 0);
    if (filterUrgency === 'Accepted') return b.liquidationOffer?.status === 'Accepted';
    return true;
  });

  const totalValueAtRisk = discountableBatches.reduce((sum, b) => {
    const spec = specs[b.productKey];
    return sum + (b.quantityKg * (spec?.retailPricePerKg || 10));
  }, 0);

  const totalPotentialSalvaged = discountableBatches.reduce((sum, b) => {
    const spec = specs[b.productKey];
    const price = spec?.retailPricePerKg || 10;
    const discount = b.recommendedDiscountPercent || 30;
    return sum + (b.quantityKg * price * (1 - discount / 100));
  }, 0);

  const totalFoodWeightKg = discountableBatches.reduce((sum, b) => sum + b.quantityKg, 0);

  const handleQuickDispatch = async (batch: Batch) => {
    const retailerId = selectedRetailerMap[batch.id] || retailers[0]?.id || 'ret-01';
    await onDispatchLiquidation(batch.id, retailerId, batch.recommendedDiscountPercent);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Financial Impact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total At-Risk Inventory</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {formatCurrency(totalValueAtRisk)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Across {discountableBatches.length} shipments needing dynamic pricing
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Salvageable Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(totalPotentialSalvaged)}
          </div>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">
            ~{((totalPotentialSalvaged / (totalValueAtRisk || 1)) * 100).toFixed(0)}% recovery rate via pre-spoilage flash discount
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Diverted Food Biomass</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {totalFoodWeightKg.toLocaleString()} kg
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            High-grade produce routed to consumer plates
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>ESG Carbon Offset</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {(totalFoodWeightKg * 2.3).toFixed(0)} kg CO2e
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Avoided landfill methane emission equivalents
          </span>
        </div>
      </div>

      {/* Main Liquidation Management Table */}
      <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              Automated Liquidation Clearinghouse
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Dynamically matched batches and discounted pricing for local grocery chains
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(['All', 'Immediate', 'Pending', 'Accepted'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterUrgency(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterUrgency === tab
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            No batches match this liquidation criteria. Cold-chain operations are currently stable!
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(batch => {
              const spec = specs[batch.productKey] || { retailPricePerKg: 10, category: 'Produce', carbonFootprintKgPerKg: 2.0 };
              const originalPrice = spec.retailPricePerKg;
              const discount = batch.recommendedDiscountPercent;
              const discountedPrice = originalPrice * (1 - discount / 100);
              const originalLotVal = batch.quantityKg * originalPrice;
              const salvageVal = batch.quantityKg * discountedPrice;
              const isAccepted = batch.liquidationOffer?.status === 'Accepted';
              const statusColors = getStatusColor(batch.status);

              return (
                <div
                  key={batch.id}
                  className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Product & Degradation Status */}
                  <div className="space-y-1.5 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{batch.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors.badge}`}>
                        {batch.status}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {batch.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-100">{batch.productName}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-1 font-mono">
                      <span>Temp: <strong className="text-neutral-200">{batch.currentTemp.toFixed(1)}°C</strong></span>
                      <span>•</span>
                      <span>RSL: <strong className="text-amber-400">{batch.remainingShelfLifeDays}d</strong> left</span>
                      <span>•</span>
                      <span>Qty: <strong className="text-neutral-200">{batch.quantityKg} kg</strong></span>
                    </div>
                  </div>

                  {/* Center: Dynamic Pricing & Salvage Breakdown */}
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Discount</span>
                      <span className="font-mono font-extrabold text-amber-400 text-sm">
                        {discount}% OFF
                      </span>
                      <span className="text-[10px] text-neutral-400 block">${discountedPrice.toFixed(2)}/kg</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Orig. Lot</span>
                      <span className="font-mono text-neutral-300">
                        {formatCurrency(originalLotVal)}
                      </span>
                      <span className="text-[10px] text-neutral-500 line-through">${originalPrice.toFixed(2)}/kg</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px]">Net Salvaged</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(salvageVal)}
                      </span>
                      <span className="text-[10px] text-emerald-500/80 block">Saved from loss</span>
                    </div>
                  </div>

                  {/* Right: Retailer Selection & Dispatch Action */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      disabled={isAccepted}
                      value={selectedRetailerMap[batch.id] || batch.liquidationOffer?.retailerId || retailers[0]?.id}
                      onChange={e => setSelectedRetailerMap(prev => ({ ...prev, [batch.id]: e.target.value }))}
                      className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 disabled:opacity-60 font-medium"
                    >
                      {retailers.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name.split(' (')[0]} ({r.distanceKm} km)
                        </option>
                      ))}
                    </select>

                    {isAccepted ? (
                      <div className="px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Dispatched ({batch.liquidationOffer?.retailerName?.split(' ')[0]})
                      </div>
                    ) : (
                      <button
                        onClick={() => handleQuickDispatch(batch)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Dispatch Offer
                      </button>
                    )}

                    <button
                      onClick={() => onSelectBatch(batch)}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-all flex items-center justify-center"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retailer Network Directory Card */}
      <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400" />
          Active Cold-Chain Liquidation Partners & Grocery Hubs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {retailers.map(r => (
            <div key={r.id} className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs space-y-1.5">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-neutral-200">{r.name}</h4>
                <span className="font-mono text-amber-400 font-semibold">{r.distanceKm} km</span>
              </div>
              <div className="text-neutral-400">{r.type}</div>
              <div className="text-neutral-500 text-[11px]">📍 {r.address}</div>
              <div className="pt-2 border-t border-neutral-800/80 flex justify-between text-neutral-400 font-mono text-[11px]">
                <span>Max Capacity: {r.maxIntakeKg} kg</span>
                <span className="text-emerald-400">Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
