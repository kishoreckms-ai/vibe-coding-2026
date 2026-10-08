import React, { useState } from 'react';
import { ProductSpec } from '../types';
import { X, Plus, Package, Truck, Thermometer, Droplets, Clock, MapPin } from 'lucide-react';

interface NewBatchModalProps {
  specs: Record<string, ProductSpec>;
  onClose: () => void;
  onCreate: (payload: {
    productKey: string;
    quantityKg: number;
    origin: string;
    destination: string;
    carrier: string;
    initialTemp?: number;
    initialHumidity?: number;
    totalExpectedTransitHours?: number;
  }) => Promise<void>;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({ specs, onClose, onCreate }) => {
  const [productKey, setProductKey] = useState<string>('strawberries');
  const [quantityKg, setQuantityKg] = useState<number>(750);
  const [origin, setOrigin] = useState<string>('Oxnard Agro Packing, CA');
  const [destination, setDestination] = useState<string>('Seattle Cold Terminal, WA');
  const [carrier, setCarrier] = useState<string>('Cascade Freight Cold Fleet');
  const [transitHours, setTransitHours] = useState<number>(36);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSpec = specs[productKey] || Object.values(specs)[0];
  const [temp, setTemp] = useState<number>((selectedSpec?.optimalTempMin + selectedSpec?.optimalTempMax) / 2 || 2);
  const [humidity, setHumidity] = useState<number>(selectedSpec?.optimalHumidityMin || 90);

  const handleProductChange = (key: string) => {
    setProductKey(key);
    const s = specs[key];
    if (s) {
      setTemp(Number(((s.optimalTempMin + s.optimalTempMax) / 2).toFixed(1)));
      setHumidity(s.optimalHumidityMin);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate({
        productKey,
        quantityKg,
        origin,
        destination,
        carrier,
        initialTemp: temp,
        initialHumidity: humidity,
        totalExpectedTransitHours: transitHours
      });
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to register shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1 text-amber-400 font-mono text-xs uppercase tracking-widest">
          <Plus className="w-4 h-4" /> Cold-Chain Ingestion
        </div>

        <h2 className="text-xl font-extrabold text-neutral-100 mb-1">
          Register New Monitored Shipment
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          Deploy simulated IoT cold-chain sensor payload with baseline degradation kinetics
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Select */}
          <div>
            <label className="text-neutral-300 font-semibold block mb-1.5">
              Select Perishable Commodity:
            </label>
            <select
              value={productKey}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              {Object.entries(specs).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.name} ({s.category} — {s.baselineShelfLifeDays}d baseline, Opt: {s.optimalTempMin}-{s.optimalTempMax}°C)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Transit Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-300 font-semibold block mb-1.5">
                Lot Weight (kg):
              </label>
              <input
                type="number"
                min={50}
                max={10000}
                required
                value={quantityKg}
                onChange={e => setQuantityKg(parseInt(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="text-neutral-300 font-semibold block mb-1.5">
                Expected Transit (Hours):
              </label>
              <input
                type="number"
                min={6}
                max={168}
                required
                value={transitHours}
                onChange={e => setTransitHours(parseInt(e.target.value) || 24)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-300 font-semibold block mb-1.5">
                Origin Facility:
              </label>
              <input
                type="text"
                required
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-neutral-300 font-semibold block mb-1.5">
                Destination Market:
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Carrier */}
          <div>
            <label className="text-neutral-300 font-semibold block mb-1.5">
              Refrigerated Logistics Carrier:
            </label>
            <input
              type="text"
              required
              value={carrier}
              onChange={e => setCarrier(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Initial Sensor Telemetry */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-3">
            <span className="text-neutral-400 font-mono text-[11px] block uppercase tracking-wider">
              Initial Sensor Calibration Setpoints:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1">
                  Start Temp (°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={e => setTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">
                  Start Humidity (%):
                </label>
                <input
                  type="number"
                  min={40}
                  max={100}
                  value={humidity}
                  onChange={e => setHumidity(parseInt(e.target.value) || 80)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? 'Registering...' : 'Deploy Shipment & Sensors'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
