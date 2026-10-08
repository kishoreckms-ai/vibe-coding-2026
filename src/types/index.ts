export type BatchStatus = 'Healthy' | 'At Risk' | 'Critical' | 'Expired';

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  transitDurationHours: number;
  location: string;
  coordinates: { lat: number; lng: number };
  tempAgingFactor: number;
  humidityAgingFactor: number;
  combinedAgingFactor: number;
  remainingShelfLifeDays: number;
}

export interface LiquidationOffer {
  id: string;
  retailerId: string;
  retailerName: string;
  recommendedDiscountPercent: number;
  originalPricePerKg: number;
  discountedPricePerKg: number;
  totalLotValueOriginal: number;
  totalLotValueDiscounted: number;
  salvagedRevenue: number;
  foodSavedKg: number;
  co2SavedKg: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Immediate';
  status: 'Pending' | 'Accepted' | 'Declined';
  dispatchedAt?: string;
}

export interface Batch {
  id: string;
  productKey: string;
  productName: string;
  category: string;
  quantityKg: number;
  origin: string;
  destination: string;
  currentLocation: string;
  transitProgressPercent: number;
  totalExpectedTransitHours: number;
  elapsedTransitHours: number;
  carrier: string;
  sensorId: string;
  startDate: string;
  currentTemp: number;
  currentHumidity: number;
  status: BatchStatus;
  initialShelfLifeDays: number;
  remainingShelfLifeDays: number;
  remainingShelfLifePercent: number;
  cumulativeAgingDaysLost: number;
  currentAgingVelocity: number;
  tempAgingMultiplier: number;
  humidityAgingMultiplier: number;
  recommendedDiscountPercent: number;
  urgencyScore: number;
  telemetryHistory: TelemetryPoint[];
  hasBreach: boolean;
  breachDescription?: string;
  liquidationOffer?: LiquidationOffer;
}

export interface ProductSpec {
  name: string;
  category: 'Berries' | 'Leafy Greens' | 'Seafood' | 'Dairy' | 'Meat' | 'Exotic Fruits';
  optimalTempMin: number;
  optimalTempMax: number;
  criticalTempMax: number;
  optimalHumidityMin: number;
  optimalHumidityMax: number;
  baselineShelfLifeDays: number;
  q10Factor: number;
  humiditySensitivity: number;
  retailPricePerKg: number;
  carbonFootprintKgPerKg: number;
}

export interface Alert {
  id: string;
  batchId: string;
  batchName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface Retailer {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  address: string;
  maxIntakeKg: number;
  contactPerson: string;
  phone: string;
  preferredCategories: string[];
}

export interface DashboardStats {
  total: number;
  healthy: number;
  atRisk: number;
  critical: number;
  expired: number;
  totalValueAtRisk: number;
  totalSalvagedRevenue: number;
  totalFoodSavedKg: number;
}
