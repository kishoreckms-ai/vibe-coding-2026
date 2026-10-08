import React, { useState } from 'react';
import { Batch, ProductSpec, Retailer, LiquidationOffer } from '../types';
import { formatCurrency } from '../utils/degradationModel';
import { DollarSign, Tag, Truck, CheckCircle2, ShieldAlert, ArrowRight, FileText, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiquidationCardProps {
  batch: Batch;
  spec: ProductSpec;
  retailers: Retailer[];
  onDispatchLiquidation: (retailerId: string, discountPercent: number) => Promise<void>;
}

export const LiquidationCard: React.FC<LiquidationCardProps> = ({
  batch,
  spec,
  retailers,
  onDispatchLiquidation
}) => {
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(retailers[0]?.id || 'ret-01');
  const [customDiscount, setCustomDiscount] = useState<number>(batch.recommendedDiscountPercent);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showManifest, setShowManifest] = useState<boolean>(false);

  const selectedRetailer = retailers.find(r => r.id === selectedRetailerId) || retailers[0];

  // Financial calculations
  const originalPrice = spec.retailPricePerKg;
  const discountedPrice = Number((originalPrice * (1 - customDiscount / 100)).toFixed(2));
  const totalOriginalValue = batch.quantityKg * originalPrice;
  const totalDiscountedValue = batch.quantityKg * discountedPrice;
  const salvagedRevenue = totalDiscountedValue;
  const co2Prevented = Number((batch.quantityKg * spec.carbonFootprintKgPerKg).toFixed(1));

  const isAccepted = batch.liquidationOffer?.status === 'Accepted';

  const handleDispatch = async () => {
    try {
      setIsSubmitting(true);
      await onDispatchLiquidation(selectedRetailerId, customDiscount);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Tag className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-neutral-100">
              Dynamic Retail Liquidation Engine
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Automated perishability-driven price discounting to pre-empt spoilage before expiry
          </p>
        </div>

        {isAccepted ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Liquidation Dispatched
          </span>
        ) : (
          <span className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl ${
            batch.urgencyScore > 75
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            <ShieldAlert className="w-4 h-4" />
            Urgency: {batch.urgencyScore > 75 ? 'Immediate Clearance' : batch.urgencyScore > 40 ? 'Proactive Re-route' : 'Standard Routine'}
          </span>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Recommended Discount</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {customDiscount}%
          </div>
          <span className="text-[10px] text-neutral-500">Based on {batch.remainingShelfLifeDays}d RSL</span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Salvaged Revenue</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(salvagedRevenue)}
          </div>
          <span className="text-[10px] text-neutral-500">From {formatCurrency(totalOriginalValue)} original</span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Rescue Price / kg</span>
          <div className="text-2xl font-bold font-mono text-neutral-200">
            ${discountedPrice.toFixed(2)}
          </div>
          <span className="text-[10px] text-neutral-500 line-through">${originalPrice.toFixed(2)}/kg</span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
          <span className="text-xs text-neutral-400 block mb-1">Food Waste Prevented</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {batch.quantityKg} kg
          </div>
          <span className="text-[10px] text-neutral-500">Offset: {co2Prevented} kg CO2e</span>
        </div>
      </div>

      {/* Discount Adjustment Slider & Retailer Selection */}
      <div className="space-y-4 mb-6 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800">
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Adjust Liquidation Discount Margin:
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">{customDiscount}% OFF</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={customDiscount}
            disabled={isAccepted}
            onChange={e => setCustomDiscount(parseInt(e.target.value))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
            <span>10% (Mild clearance)</span>
            <span>Recommended: {batch.recommendedDiscountPercent}%</span>
            <span>90% (Flash emergency)</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-300 font-semibold block mb-2">
            Target Nearby Retailer / Hub:
          </label>
          <select
            value={selectedRetailerId}
            disabled={isAccepted}
            onChange={e => setSelectedRetailerId(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 disabled:opacity-50 font-medium"
          >
            {retailers.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.distanceKm} km away ({r.type}, Max Intake: {r.maxIntakeKg} kg)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setShowManifest(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-neutral-700"
        >
          <FileText className="w-4 h-4 text-neutral-400" />
          View Rescue Bill of Lading Manifest
        </button>

        {isAccepted ? (
          <div className="w-full sm:w-auto flex items-center gap-2 text-xs text-emerald-400 font-semibold px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            Dispatched to {batch.liquidationOffer?.retailerName} ({batch.liquidationOffer?.recommendedDiscountPercent}% OFF)
          </div>
        ) : (
          <button
            onClick={handleDispatch}
            disabled={isSubmitting || customDiscount === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            <Truck className="w-4 h-4" />
            {isSubmitting ? 'Routing Shipment...' : `Dispatch ${customDiscount}% Discount to ${selectedRetailer?.name.split(' ')[0]}`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bill of Lading / Manifest Modal */}
      {showManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowManifest(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-amber-400 font-mono text-xs uppercase tracking-widest">
              <FileText className="w-4 h-4" /> AgroSense Cold-Chain Bill of Lading #BOL-{batch.id.replace('AGR-', '')}
            </div>

            <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-950 text-xs space-y-4 font-mono text-neutral-300">
              <div className="flex justify-between border-b border-neutral-800 pb-3">
                <div>
                  <div className="font-bold text-sm text-neutral-100">AGROSENSE RESCUE MANIFEST</div>
                  <div className="text-[10px] text-neutral-500">Automated Cold-Chain Liquidation Clearinghouse</div>
                </div>
                <div className="text-right">
                  <div>BATCH ID: <span className="text-amber-400">{batch.id}</span></div>
                  <div className="text-[10px] text-neutral-500">DATE: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-neutral-500 block">ORIGIN / CARRIER:</span>
                  <div className="text-neutral-200">{batch.origin}</div>
                  <div className="text-neutral-400">{batch.carrier}</div>
                </div>
                <div>
                  <span className="text-neutral-500 block">CONSIGNEE / LIQUIDATOR:</span>
                  <div className="text-neutral-200">{selectedRetailer?.name}</div>
                  <div className="text-neutral-400">{selectedRetailer?.address}</div>
                </div>
              </div>

              <div className="border-t border-b border-neutral-800 py-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Commodity:</span>
                  <span className="text-neutral-100 font-bold">{batch.productName} ({spec.category})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Lot Weight:</span>
                  <span className="text-neutral-200">{batch.quantityKg} kg net</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Pre-Excursion Retail Price:</span>
                  <span className="text-neutral-200">${originalPrice.toFixed(2)}/kg (${totalOriginalValue.toLocaleString()})</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Authorized Liquidation Discount:</span>
                  <span>{customDiscount}% OFF</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1 border-t border-neutral-800">
                  <span>Net Salvaged Payable:</span>
                  <span>{formatCurrency(salvagedRevenue)} (${discountedPrice.toFixed(2)}/kg)</span>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 space-y-1">
                <div>Sensor ID: {batch.sensorId} | Current Temp: {batch.currentTemp}°C | Remaining Shelf Life: {batch.remainingShelfLifeDays} days</div>
                <div className="text-emerald-400">Environmental Savings: {co2Prevented} kg CO2e diverted from organic landfill degradation.</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
              >
                Print Manifest
              </button>
              <button
                onClick={() => setShowManifest(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
