import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || (process.env.NODE_ENV === 'development' ? '3000' : '8080'), 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Perishable product specifications & baseline constants
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
  humiditySensitivity: number; // aging acceleration per % below optimal RH
  retailPricePerKg: number;
  carbonFootprintKgPerKg: number;
}

export const PRODUCT_SPECS: Record<string, ProductSpec> = {
  'strawberries': {
    name: 'Organic California Strawberries',
    category: 'Berries',
    optimalTempMin: 0.5,
    optimalTempMax: 2.5,
    criticalTempMax: 6.0,
    optimalHumidityMin: 90,
    optimalHumidityMax: 95,
    baselineShelfLifeDays: 7.0,
    q10Factor: 2.8,
    humiditySensitivity: 0.035,
    retailPricePerKg: 8.50,
    carbonFootprintKgPerKg: 1.8
  },
  'salmon': {
    name: 'Wild Atlantic Salmon Fillets',
    category: 'Seafood',
    optimalTempMin: -0.5,
    optimalTempMax: 1.5,
    criticalTempMax: 4.0,
    optimalHumidityMin: 85,
    optimalHumidityMax: 90,
    baselineShelfLifeDays: 5.0,
    q10Factor: 3.2,
    humiditySensitivity: 0.02,
    retailPricePerKg: 24.00,
    carbonFootprintKgPerKg: 5.4
  },
  'avocados': {
    name: 'Hass Avocados (Cold Cured)',
    category: 'Exotic Fruits',
    optimalTempMin: 5.0,
    optimalTempMax: 7.5,
    criticalTempMax: 12.0,
    optimalHumidityMin: 85,
    optimalHumidityMax: 90,
    baselineShelfLifeDays: 14.0,
    q10Factor: 2.2,
    humiditySensitivity: 0.025,
    retailPricePerKg: 6.00,
    carbonFootprintKgPerKg: 2.1
  },
  'spinach': {
    name: 'Hydroponic Baby Spinach',
    category: 'Leafy Greens',
    optimalTempMin: 1.0,
    optimalTempMax: 3.0,
    criticalTempMax: 7.0,
    optimalHumidityMin: 95,
    optimalHumidityMax: 98,
    baselineShelfLifeDays: 8.0,
    q10Factor: 2.7,
    humiditySensitivity: 0.05,
    retailPricePerKg: 9.00,
    carbonFootprintKgPerKg: 1.4
  },
  'milk': {
    name: 'Grade-A Artisan Whole Milk',
    category: 'Dairy',
    optimalTempMin: 1.0,
    optimalTempMax: 3.5,
    criticalTempMax: 6.5,
    optimalHumidityMin: 70,
    optimalHumidityMax: 85,
    baselineShelfLifeDays: 12.0,
    q10Factor: 2.9,
    humiditySensitivity: 0.01,
    retailPricePerKg: 3.80,
    carbonFootprintKgPerKg: 3.2
  },
  'wagyu': {
    name: 'Prime Wagyu Beef Striploin',
    category: 'Meat',
    optimalTempMin: -1.0,
    optimalTempMax: 2.0,
    criticalTempMax: 5.0,
    optimalHumidityMin: 80,
    optimalHumidityMax: 85,
    baselineShelfLifeDays: 10.0,
    q10Factor: 2.5,
    humiditySensitivity: 0.02,
    retailPricePerKg: 45.00,
    carbonFootprintKgPerKg: 27.0
  }
};

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

export type BatchStatus = 'Healthy' | 'At Risk' | 'Critical' | 'Expired';

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
  
  // Current Live State
  currentTemp: number;
  currentHumidity: number;
  status: BatchStatus;
  
  // Degradation Model Calculations
  initialShelfLifeDays: number;
  remainingShelfLifeDays: number;
  remainingShelfLifePercent: number;
  cumulativeAgingDaysLost: number;
  currentAgingVelocity: number;
  tempAgingMultiplier: number;
  humidityAgingMultiplier: number;
  
  // Dynamic Discount Recommendation
  recommendedDiscountPercent: number;
  urgencyScore: number; // 0 to 100
  liquidationOffer?: LiquidationOffer;
  
  // History
  telemetryHistory: TelemetryPoint[];
  hasBreach: boolean;
  breachDescription?: string;
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

export interface DatabaseSchema {
  batches: Batch[];
  alerts: Alert[];
  retailers: Retailer[];
  simulation: {
    isRunning: boolean;
    tickIntervalSeconds: number;
    lastTickAt: string;
    totalTicks: number;
  };
}

// -------------------------------------------------------------
// Deterministic Degradation Engine
// -------------------------------------------------------------
export function calculateAgingFactors(
  temp: number,
  humidity: number,
  spec: ProductSpec
): {
  tempAgingFactor: number;
  humidityAgingFactor: number;
  combinedAgingFactor: number;
} {
  // 1. Temperature factor via Arrhenius / Q10 relationship
  let tempAging = 1.0;
  if (temp > spec.optimalTempMax) {
    const deltaT = temp - spec.optimalTempMax;
    tempAging = Math.pow(spec.q10Factor, deltaT / 10);
    // Severe thermal excursion penalty if above critical threshold
    if (temp > spec.criticalTempMax) {
      tempAging *= (1 + 0.20 * (temp - spec.criticalTempMax));
    }
  } else if (temp < spec.optimalTempMin) {
    // Chilling / Freezing injury check
    if (temp < -1.5) {
      tempAging = 2.0; // Freeze damage
    } else {
      tempAging = 1.0; // Safe optimal range
    }
  } else {
    tempAging = 1.0; // Optimal nominal
  }

  // 2. Relative Humidity factor (Vapor pressure deficit & moisture transpirational loss)
  let humAging = 1.0;
  if (humidity < spec.optimalHumidityMin) {
    const deltaHum = spec.optimalHumidityMin - humidity;
    humAging = 1.0 + (deltaHum * spec.humiditySensitivity);
  } else if (humidity > 98) {
    // Free water condensation promoting rapid fungal / bacterial rot
    humAging = 1.0 + ((humidity - 98) * 0.12);
  } else {
    humAging = 1.0;
  }

  const combined = Number((tempAging * humAging).toFixed(2));
  return {
    tempAgingFactor: Number(tempAging.toFixed(2)),
    humidityAgingFactor: Number(humAging.toFixed(2)),
    combinedAgingFactor: combined
  };
}

export function evaluateBatchStatus(
  remainingDays: number,
  baselineDays: number,
  currentAgingFactor: number
): BatchStatus {
  if (remainingDays <= 0.15) {
    return 'Expired';
  }
  const pct = (remainingDays / baselineDays) * 100;
  if (pct < 22 || (remainingDays < 1.0 && currentAgingFactor > 2.0)) {
    return 'Critical';
  }
  if (pct < 55 || currentAgingFactor >= 1.6) {
    return 'At Risk';
  }
  return 'Healthy';
}

export function calculateDynamicDiscount(
  remainingDays: number,
  baselineDays: number,
  status: BatchStatus,
  currentAgingFactor: number,
  transitHoursRemaining: number
): {
  recommendedDiscount: number;
  urgencyScore: number;
} {
  if (status === 'Expired' || remainingDays <= 0.2) {
    return { recommendedDiscount: 100, urgencyScore: 100 };
  }

  const hoursToSpoilage = remainingDays * 24;
  // Urgency ratio: how tight is the gap between arriving and spoiling?
  const marginHours = Math.max(0, hoursToSpoilage - transitHoursRemaining);

  let discount = 0;
  let urgency = 10;

  if (hoursToSpoilage <= 24) {
    // Less than 24 hours left: Emergency clearance
    discount = 70 + Math.min(20, Math.floor((24 - hoursToSpoilage) / 2) * 2);
    urgency = 95;
  } else if (hoursToSpoilage <= 48) {
    // 24 - 48 hours: Heavy liquidation
    discount = 45 + Math.min(25, Math.floor((48 - hoursToSpoilage) / 4) * 3);
    urgency = 80;
  } else if (hoursToSpoilage <= 72 || status === 'At Risk') {
    // 48 - 72 hours or sustained breach: Proactive early discount
    discount = 25 + Math.min(20, Math.floor((72 - hoursToSpoilage) / 6) * 3);
    urgency = 55;
  } else if (remainingDays < (baselineDays * 0.5)) {
    discount = 15;
    urgency = 35;
  } else {
    discount = 0;
    urgency = 10;
  }

  // Adjust for accelerated aging rate
  if (currentAgingFactor > 2.0 && discount < 50) {
    discount = Math.min(75, discount + 15);
    urgency = Math.min(95, urgency + 20);
  }

  return {
    recommendedDiscount: Math.min(90, Math.max(0, Math.round(discount))),
    urgencyScore: Math.min(100, Math.max(5, Math.round(urgency)))
  };
}

// -------------------------------------------------------------
// Database Seed & Persistence
// -------------------------------------------------------------
function seedDatabase(): DatabaseSchema {
  const retailers: Retailer[] = [
    {
      id: 'ret-01',
      name: 'Metro Fresh Supermarket (Downtown Hub)',
      type: 'Hypermarket Chain',
      distanceKm: 8.5,
      address: '420 Commercial Ave, Downtown',
      maxIntakeKg: 2500,
      contactPerson: 'David Chen (Procurement)',
      phone: '+1 (555) 329-8472',
      preferredCategories: ['Berries', 'Leafy Greens', 'Dairy', 'Meat']
    },
    {
      id: 'ret-02',
      name: 'GreenLife Organic Co-operative',
      type: 'Specialty Produce Market',
      distanceKm: 14.2,
      address: '88 Eco Way, West District',
      maxIntakeKg: 800,
      contactPerson: 'Sarah Jenkins (Store Director)',
      phone: '+1 (555) 782-9011',
      preferredCategories: ['Berries', 'Leafy Greens', 'Exotic Fruits']
    },
    {
      id: 'ret-03',
      name: 'Bayside Wholesale Seafood & Deli',
      type: 'Cold-Chain Specialty Retailer',
      distanceKm: 6.1,
      address: '15 Harbor Blvd, Pier 9',
      maxIntakeKg: 1200,
      contactPerson: 'Marco Rossi',
      phone: '+1 (555) 441-2309',
      preferredCategories: ['Seafood', 'Meat']
    },
    {
      id: 'ret-04',
      name: 'Daily Harvest Community Grocers',
      type: 'Neighborhood Supermarket',
      distanceKm: 19.8,
      address: '740 Valley View Rd, Suburb North',
      maxIntakeKg: 1500,
      contactPerson: 'Elena Rostova',
      phone: '+1 (555) 912-3844',
      preferredCategories: ['Dairy', 'Leafy Greens', 'Exotic Fruits']
    },
    {
      id: 'ret-05',
      name: 'City Food Rescue & Urban Relief Bank',
      type: 'Non-profit Food Redistribution',
      distanceKm: 4.8,
      address: '12 Civic Center Plaza',
      maxIntakeKg: 4000,
      contactPerson: 'Angela Brooks (Rescue Logistics)',
      phone: '+1 (555) 120-4490',
      preferredCategories: ['Berries', 'Leafy Greens', 'Dairy', 'Seafood', 'Meat', 'Exotic Fruits']
    }
  ];

  // Helper to construct realistic telemetry history
  const createTelemetryHistory = (
    productKey: string,
    historyProfile: {
      hoursElapsed: number;
      stepHours: number;
      tempPoints: number[];
      humidityPoints: number[];
      locations: string[];
    }
  ): { history: TelemetryPoint[]; remainingDays: number; cumulativeLoss: number } => {
    const spec = PRODUCT_SPECS[productKey];
    let remainingDays = spec.baselineShelfLifeDays;
    let cumulativeLoss = 0;
    const history: TelemetryPoint[] = [];

    const totalSteps = historyProfile.tempPoints.length;
    for (let i = 0; i < totalSteps; i++) {
      const stepHour = (i + 1) * historyProfile.stepHours;
      const temp = historyProfile.tempPoints[i];
      const hum = historyProfile.humidityPoints[i];
      const factors = calculateAgingFactors(temp, hum, spec);
      
      const hoursInStep = historyProfile.stepHours;
      const consumedNominalDays = (hoursInStep / 24) * factors.combinedAgingFactor;
      remainingDays = Math.max(0, remainingDays - consumedNominalDays);
      cumulativeLoss += (consumedNominalDays - (hoursInStep / 24));

      history.push({
        id: `tel-${i}-${Date.now()}`,
        timestamp: new Date(Date.now() - (totalSteps - i) * historyProfile.stepHours * 3600 * 1000).toISOString(),
        temperature: temp,
        humidity: hum,
        transitDurationHours: stepHour,
        location: historyProfile.locations[i] || 'En Route Highway I-5',
        coordinates: {
          lat: 36.5 + (i * 0.3),
          lng: -120.2 - (i * 0.2)
        },
        tempAgingFactor: factors.tempAgingFactor,
        humidityAgingFactor: factors.humidityAgingFactor,
        combinedAgingFactor: factors.combinedAgingFactor,
        remainingShelfLifeDays: Number(remainingDays.toFixed(2))
      });
    }

    return { history, remainingDays: Number(remainingDays.toFixed(2)), cumulativeLoss: Number(cumulativeLoss.toFixed(2)) };
  };

  // 1. Strawberries - At Risk (Thermal excursion in Transit Hub B)
  const strawData = createTelemetryHistory('strawberries', {
    hoursElapsed: 36,
    stepHours: 4,
    tempPoints: [1.2, 1.4, 2.0, 3.8, 5.5, 6.2, 5.9, 5.1, 4.8],
    humidityPoints: [93, 92, 91, 88, 86, 85, 87, 88, 89],
    locations: [
      'Salinas Valley Packing Facility',
      'Central Valley Checkpoint',
      'Fresno Logistics Junction',
      'Tejon Pass Transit Hub',
      'Bakersfield Cold Cross-Dock',
      'Bakersfield Hub (Thermal Anomaly)',
      'LA North Interstate corridor',
      'San Fernando Valley Gateway',
      'LA Regional Distribution Center'
    ]
  });
  const strawSpec = PRODUCT_SPECS['strawberries'];
  const strawAging = calculateAgingFactors(4.8, 89, strawSpec);
  const strawDiscount = calculateDynamicDiscount(strawData.remainingDays, strawSpec.baselineShelfLifeDays, 'At Risk', strawAging.combinedAgingFactor, 12);

  // 2. Salmon - Critical (Severe temperature spike to 4.8°C, only 1.1 days left)
  const salmonData = createTelemetryHistory('salmon', {
    hoursElapsed: 40,
    stepHours: 4,
    tempPoints: [0.2, 0.4, 0.8, 2.5, 4.2, 4.9, 5.2, 4.8, 4.5, 4.3],
    humidityPoints: [88, 87, 86, 84, 82, 80, 81, 83, 84, 85],
    locations: [
      'Seattle Cold Storage Port',
      'Tacoma Transit Yard',
      'Portland Intermodal Hub',
      'Eugene Oregon Inspection Station',
      'Siskiyou Pass (Cooling Unit Alert)',
      'Redding Cross-Dock',
      'Sacramento North Hub',
      'Stockton Freight Depot',
      'Modesto Gateway Terminal',
      'Oakland Port Terminal'
    ]
  });
  const salmonSpec = PRODUCT_SPECS['salmon'];
  const salmonAging = calculateAgingFactors(4.3, 85, salmonSpec);
  const salmonDiscount = calculateDynamicDiscount(salmonData.remainingDays, salmonSpec.baselineShelfLifeDays, 'Critical', salmonAging.combinedAgingFactor, 8);

  // 3. Avocados - Healthy (nominal cold chain)
  const avoData = createTelemetryHistory('avocados', {
    hoursElapsed: 48,
    stepHours: 6,
    tempPoints: [5.6, 5.8, 6.0, 5.9, 5.7, 5.5, 5.6, 5.4],
    humidityPoints: [88, 87, 88, 89, 87, 88, 89, 88],
    locations: [
      'Michoacán Cold Prep Center',
      'Laredo Port of Entry',
      'San Antonio Distribution Hub',
      'Austin Transit Terminal',
      'Waco North Checkpoint',
      'Dallas Freight Junction',
      'Fort Worth Cold Storage',
      'DFW Regional Depot'
    ]
  });
  const avoSpec = PRODUCT_SPECS['avocados'];
  const avoAging = calculateAgingFactors(5.4, 88, avoSpec);
  const avoDiscount = calculateDynamicDiscount(avoData.remainingDays, avoSpec.baselineShelfLifeDays, 'Healthy', avoAging.combinedAgingFactor, 24);

  // 4. Baby Spinach - At Risk (Humidity drop down to 74%)
  const spinachData = createTelemetryHistory('spinach', {
    hoursElapsed: 24,
    stepHours: 3,
    tempPoints: [1.5, 1.8, 2.2, 2.5, 2.8, 3.2, 3.4, 3.1],
    humidityPoints: [96, 94, 88, 82, 76, 73, 72, 74],
    locations: [
      'Santa Maria Greenhouse Farm',
      'San Luis Obispo Terminal',
      'Paso Robles Checkpoint',
      'Salinas Valley Connector',
      'Gilroy Transit Corridor',
      'San Jose Logistics Yard',
      'San Francisco Peninsula Hub',
      'SF Food Distribution Center'
    ]
  });
  const spinachSpec = PRODUCT_SPECS['spinach'];
  const spinachAging = calculateAgingFactors(3.1, 74, spinachSpec);
  const spinachDiscount = calculateDynamicDiscount(spinachData.remainingDays, spinachSpec.baselineShelfLifeDays, 'At Risk', spinachAging.combinedAgingFactor, 10);

  // 5. Whole Milk - Healthy (2.0°C, pristine condition)
  const milkData = createTelemetryHistory('milk', {
    hoursElapsed: 28,
    stepHours: 4,
    tempPoints: [1.8, 1.9, 2.1, 2.0, 1.9, 2.2, 2.1],
    humidityPoints: [78, 79, 80, 78, 79, 80, 81],
    locations: [
      'Sonoma Artisan Dairy Co-op',
      'Santa Rosa Depo',
      'Novato Checkpoint',
      'San Rafael Gateway',
      'Richmond Logistics Park',
      'Berkeley Depot',
      'Oakland Distribution Center'
    ]
  });
  const milkSpec = PRODUCT_SPECS['milk'];
  const milkAging = calculateAgingFactors(2.1, 81, milkSpec);
  const milkDiscount = calculateDynamicDiscount(milkData.remainingDays, milkSpec.baselineShelfLifeDays, 'Healthy', milkAging.combinedAgingFactor, 6);

  // 6. Wagyu Beef - Critical (Cooling unit failure in transit)
  const wagyuData = createTelemetryHistory('wagyu', {
    hoursElapsed: 32,
    stepHours: 4,
    tempPoints: [0.0, 0.5, 1.2, 3.5, 4.8, 5.6, 6.2, 5.8],
    humidityPoints: [83, 82, 81, 79, 78, 77, 76, 78],
    locations: [
      'Omaha Prime Processing Center',
      'Lincoln Nebraska Hub',
      'Des Moines Transit Cross-Dock',
      'Quad Cities River Crossing',
      'Peoria Junction (Aux Reefer Alert)',
      'Rockford Cold Logistics',
      'Chicago O\'Hare Cargo Gateway',
      'Chicago Central Distribution Hub'
    ]
  });
  const wagyuSpec = PRODUCT_SPECS['wagyu'];
  const wagyuAging = calculateAgingFactors(5.8, 78, wagyuSpec);
  const wagyuDiscount = calculateDynamicDiscount(wagyuData.remainingDays, wagyuSpec.baselineShelfLifeDays, 'Critical', wagyuAging.combinedAgingFactor, 14);

  const batches: Batch[] = [
    {
      id: 'AGR-9041',
      productKey: 'strawberries',
      productName: strawSpec.name,
      category: strawSpec.category,
      quantityKg: 850,
      origin: 'Salinas Valley, CA',
      destination: 'Los Angeles Metro, CA',
      currentLocation: 'San Fernando Valley Gateway (I-5 Mile 162)',
      transitProgressPercent: 78,
      totalExpectedTransitHours: 48,
      elapsedTransitHours: 36,
      carrier: 'Pacific Cold Express Fleet #14',
      sensorId: 'SNSR-BT-8921',
      startDate: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      currentTemp: 4.8,
      currentHumidity: 89,
      status: 'At Risk',
      initialShelfLifeDays: strawSpec.baselineShelfLifeDays,
      remainingShelfLifeDays: strawData.remainingDays,
      remainingShelfLifePercent: Number(((strawData.remainingDays / strawSpec.baselineShelfLifeDays) * 100).toFixed(1)),
      cumulativeAgingDaysLost: strawData.cumulativeLoss,
      currentAgingVelocity: strawAging.combinedAgingFactor,
      tempAgingMultiplier: strawAging.tempAgingFactor,
      humidityAgingMultiplier: strawAging.humidityAgingFactor,
      recommendedDiscountPercent: strawDiscount.recommendedDiscount,
      urgencyScore: strawDiscount.urgencyScore,
      telemetryHistory: strawData.history,
      hasBreach: true,
      breachDescription: 'Reefer compressor temperature peaked at 6.2°C during Bakersfield transit. Accelerated aging rate reached 2.8x nominal.',
      liquidationOffer: {
        id: 'liq-9041',
        retailerId: 'ret-01',
        retailerName: 'Metro Fresh Supermarket (Downtown Hub)',
        recommendedDiscountPercent: 35,
        originalPricePerKg: strawSpec.retailPricePerKg,
        discountedPricePerKg: Number((strawSpec.retailPricePerKg * 0.65).toFixed(2)),
        totalLotValueOriginal: Number((850 * strawSpec.retailPricePerKg).toFixed(2)),
        totalLotValueDiscounted: Number((850 * strawSpec.retailPricePerKg * 0.65).toFixed(2)),
        salvagedRevenue: Number((850 * strawSpec.retailPricePerKg * 0.65).toFixed(2)),
        foodSavedKg: 850,
        co2SavedKg: Number((850 * strawSpec.carbonFootprintKgPerKg).toFixed(1)),
        urgency: 'High',
        status: 'Pending'
      }
    },
    {
      id: 'AGR-8820',
      productKey: 'salmon',
      productName: salmonSpec.name,
      category: salmonSpec.category,
      quantityKg: 420,
      origin: 'Seattle Port Terminal, WA',
      destination: 'San Francisco Bay Area, CA',
      currentLocation: 'Oakland Port Terminal, Dock 4',
      transitProgressPercent: 88,
      totalExpectedTransitHours: 48,
      elapsedTransitHours: 40,
      carrier: 'Northwest Glacier Freight Lines',
      sensorId: 'SNSR-SL-4022',
      startDate: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
      currentTemp: 4.3,
      currentHumidity: 85,
      status: 'Critical',
      initialShelfLifeDays: salmonSpec.baselineShelfLifeDays,
      remainingShelfLifeDays: salmonData.remainingDays,
      remainingShelfLifePercent: Number(((salmonData.remainingDays / salmonSpec.baselineShelfLifeDays) * 100).toFixed(1)),
      cumulativeAgingDaysLost: salmonData.cumulativeLoss,
      currentAgingVelocity: salmonAging.combinedAgingFactor,
      tempAgingMultiplier: salmonAging.tempAgingFactor,
      humidityAgingMultiplier: salmonAging.humidityAgingFactor,
      recommendedDiscountPercent: salmonDiscount.recommendedDiscount,
      urgencyScore: salmonDiscount.urgencyScore,
      telemetryHistory: salmonData.history,
      hasBreach: true,
      breachDescription: 'Thermal sensor detected critical excursion to 5.2°C at Siskiyou Pass. Spoilage risk imminent within 26 hours.',
      liquidationOffer: {
        id: 'liq-8820',
        retailerId: 'ret-03',
        retailerName: 'Bayside Wholesale Seafood & Deli',
        recommendedDiscountPercent: 65,
        originalPricePerKg: salmonSpec.retailPricePerKg,
        discountedPricePerKg: Number((salmonSpec.retailPricePerKg * 0.35).toFixed(2)),
        totalLotValueOriginal: Number((420 * salmonSpec.retailPricePerKg).toFixed(2)),
        totalLotValueDiscounted: Number((420 * salmonSpec.retailPricePerKg * 0.35).toFixed(2)),
        salvagedRevenue: Number((420 * salmonSpec.retailPricePerKg * 0.35).toFixed(2)),
        foodSavedKg: 420,
        co2SavedKg: Number((420 * salmonSpec.carbonFootprintKgPerKg).toFixed(1)),
        urgency: 'Immediate',
        status: 'Accepted',
        dispatchedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    },
    {
      id: 'AGR-7412',
      productKey: 'avocados',
      productName: avoSpec.name,
      category: avoSpec.category,
      quantityKg: 1600,
      origin: 'Laredo Cross-Border Hub, TX',
      destination: 'Dallas-Fort Worth Metroplex, TX',
      currentLocation: 'Fort Worth Cold Storage Depot',
      transitProgressPercent: 80,
      totalExpectedTransitHours: 60,
      elapsedTransitHours: 48,
      carrier: 'SunBelt Refrigerated Logistics',
      sensorId: 'SNSR-AV-1099',
      startDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      currentTemp: 5.4,
      currentHumidity: 88,
      status: 'Healthy',
      initialShelfLifeDays: avoSpec.baselineShelfLifeDays,
      remainingShelfLifeDays: avoData.remainingDays,
      remainingShelfLifePercent: Number(((avoData.remainingDays / avoSpec.baselineShelfLifeDays) * 100).toFixed(1)),
      cumulativeAgingDaysLost: avoData.cumulativeLoss,
      currentAgingVelocity: avoAging.combinedAgingFactor,
      tempAgingMultiplier: avoAging.tempAgingFactor,
      humidityAgingMultiplier: avoAging.humidityAgingFactor,
      recommendedDiscountPercent: avoDiscount.recommendedDiscount,
      urgencyScore: avoDiscount.urgencyScore,
      telemetryHistory: avoData.history,
      hasBreach: false
    },
    {
      id: 'AGR-6105',
      productKey: 'spinach',
      productName: spinachSpec.name,
      category: spinachSpec.category,
      quantityKg: 520,
      origin: 'Santa Maria Farms, CA',
      destination: 'San Francisco Produce Market, CA',
      currentLocation: 'San Francisco Peninsula Hub',
      transitProgressPercent: 85,
      totalExpectedTransitHours: 30,
      elapsedTransitHours: 24,
      carrier: 'Bay Green Haulers Unit 9',
      sensorId: 'SNSR-SP-7711',
      startDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      currentTemp: 3.1,
      currentHumidity: 74,
      status: 'At Risk',
      initialShelfLifeDays: spinachSpec.baselineShelfLifeDays,
      remainingShelfLifeDays: spinachData.remainingDays,
      remainingShelfLifePercent: Number(((spinachData.remainingDays / spinachSpec.baselineShelfLifeDays) * 100).toFixed(1)),
      cumulativeAgingDaysLost: spinachData.cumulativeLoss,
      currentAgingVelocity: spinachAging.combinedAgingFactor,
      tempAgingMultiplier: spinachAging.tempAgingFactor,
      humidityAgingMultiplier: spinachAging.humidityAgingFactor,
      recommendedDiscountPercent: spinachDiscount.recommendedDiscount,
      urgencyScore: spinachDiscount.urgencyScore,
      telemetryHistory: spinachData.history,
      hasBreach: true,
      breachDescription: 'Container humidity collapsed from 95% down to 72% RH. High transpirational dehydration accelerates wilting.',
      liquidationOffer: {
        id: 'liq-6105',
        retailerId: 'ret-02',
        retailerName: 'GreenLife Organic Co-operative',
        recommendedDiscountPercent: 30,
        originalPricePerKg: spinachSpec.retailPricePerKg,
        discountedPricePerKg: Number((spinachSpec.retailPricePerKg * 0.70).toFixed(2)),
        totalLotValueOriginal: Number((520 * spinachSpec.retailPricePerKg).toFixed(2)),
        totalLotValueDiscounted: Number((520 * spinachSpec.retailPricePerKg * 0.70).toFixed(2)),
        salvagedRevenue: Number((520 * spinachSpec.retailPricePerKg * 0.70).toFixed(2)),
        foodSavedKg: 520,
        co2SavedKg: Number((520 * spinachSpec.carbonFootprintKgPerKg).toFixed(1)),
        urgency: 'Medium',
        status: 'Pending'
      }
    },
    {
      id: 'AGR-5029',
      productKey: 'milk',
      productName: milkSpec.name,
      category: milkSpec.category,
      quantityKg: 2100,
      origin: 'Sonoma Valley Co-op, CA',
      destination: 'Oakland Regional Depot, CA',
      currentLocation: 'Berkeley Freight Arterial Corridor',
      transitProgressPercent: 92,
      totalExpectedTransitHours: 32,
      elapsedTransitHours: 28,
      carrier: 'Golden State Dairy Transport',
      sensorId: 'SNSR-MK-3100',
      startDate: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      currentTemp: 2.1,
      currentHumidity: 81,
      status: 'Healthy',
      initialShelfLifeDays: milkSpec.baselineShelfLifeDays,
      remainingShelfLifeDays: milkData.remainingDays,
      remainingShelfLifePercent: Number(((milkData.remainingDays / milkSpec.baselineShelfLifeDays) * 100).toFixed(1)),
      cumulativeAgingDaysLost: milkData.cumulativeLoss,
      currentAgingVelocity: milkAging.combinedAgingFactor,
      tempAgingMultiplier: milkAging.tempAgingFactor,
      humidityAgingMultiplier: milkAging.humidityAgingFactor,
      recommendedDiscountPercent: milkDiscount.recommendedDiscount,
      urgencyScore: milkDiscount.urgencyScore,
      telemetryHistory: milkData.history,
      hasBreach: false
    },
    {
      id: 'AGR-4311',
      productKey: 'wagyu',
      productName: wagyuSpec.name,
      category: wagyuSpec.category,
      quantityKg: 310,
      origin: 'Omaha Processing, NE',
      destination: 'Chicago Central Logistics, IL',
      currentLocation: 'Chicago Central Distribution Hub, Ramp 12',
      transitProgressPercent: 95,
      totalExpectedTransitHours: 36,
      elapsedTransitHours: 32,
      carrier: 'Midwest Prime Reefer Unit 04',
      sensorId: 'SNSR-WG-0909',
      startDate: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
      currentTemp: 5.8,
      currentHumidity: 78,
      status: 'Critical',
      initialShelfLifeDays: wagyuSpec.baselineShelfLifeDays,
      remainingShelfLifeDays: wagyuData.remainingDays,
      remainingShelfLifePercent: Number(((wagyuData.remainingDays / wagyuSpec.baselineShelfLifeDays) * 100).toFixed(1)),
      cumulativeAgingDaysLost: wagyuData.cumulativeLoss,
      currentAgingVelocity: wagyuAging.combinedAgingFactor,
      tempAgingMultiplier: wagyuAging.tempAgingFactor,
      humidityAgingMultiplier: wagyuAging.humidityAgingFactor,
      recommendedDiscountPercent: wagyuDiscount.recommendedDiscount,
      urgencyScore: wagyuDiscount.urgencyScore,
      telemetryHistory: wagyuData.history,
      hasBreach: true,
      breachDescription: 'Auxiliary refrigeration failed during Peoria transit stop. Core temp climbed to 6.2°C for 5 hours.',
      liquidationOffer: {
        id: 'liq-4311',
        retailerId: 'ret-01',
        retailerName: 'Metro Fresh Supermarket (Downtown Hub)',
        recommendedDiscountPercent: 60,
        originalPricePerKg: wagyuSpec.retailPricePerKg,
        discountedPricePerKg: Number((wagyuSpec.retailPricePerKg * 0.40).toFixed(2)),
        totalLotValueOriginal: Number((310 * wagyuSpec.retailPricePerKg).toFixed(2)),
        totalLotValueDiscounted: Number((310 * wagyuSpec.retailPricePerKg * 0.40).toFixed(2)),
        salvagedRevenue: Number((310 * wagyuSpec.retailPricePerKg * 0.40).toFixed(2)),
        foodSavedKg: 310,
        co2SavedKg: Number((310 * wagyuSpec.carbonFootprintKgPerKg).toFixed(1)),
        urgency: 'Immediate',
        status: 'Pending'
      }
    }
  ];

  const alerts: Alert[] = [
    {
      id: 'alt-01',
      batchId: 'AGR-8820',
      batchName: 'Wild Atlantic Salmon Fillets',
      severity: 'CRITICAL',
      title: 'Thermal Excursion Breach — 5.2°C Exceeded',
      message: 'Refrigeration unit exceeded critical threshold (4.0°C) for 6.2 hours. Remaining shelf life plunged to 1.1 days. Urgent liquidation required.',
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      resolved: false
    },
    {
      id: 'alt-02',
      batchId: 'AGR-4311',
      batchName: 'Prime Wagyu Beef Striploin',
      severity: 'CRITICAL',
      title: 'Auxiliary Cooling Failure in Transit',
      message: 'Trailer reefer power fluctuation at Peoria. Temperature rose to 5.8°C. Degradation velocity at 2.6x nominal.',
      timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      resolved: false
    },
    {
      id: 'alt-03',
      batchId: 'AGR-9041',
      batchName: 'Organic California Strawberries',
      severity: 'WARNING',
      title: 'Temperature Elevated in Transit Hub B',
      message: 'Bakersfield transfer dock temperature reached 6.2°C. Dynamic discount recommendation increased to 35%.',
      timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      resolved: false
    },
    {
      id: 'alt-04',
      batchId: 'AGR-6105',
      batchName: 'Hydroponic Baby Spinach',
      severity: 'WARNING',
      title: 'Severe Humidity Deficit (72% RH)',
      message: 'Optimal range is 95-98%. Water loss acceleration factor is 2.15x. Wilting warning triggered.',
      timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      resolved: false
    },
    {
      id: 'alt-05',
      batchId: 'AGR-7412',
      batchName: 'Hass Avocados (Cold Cured)',
      severity: 'INFO',
      title: 'Checkpoint Reached: DFW Regional Hub',
      message: 'Batch arrived at intermediate distribution center within target thermal window (5.4°C).',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      resolved: true,
      resolvedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
    }
  ];

  return {
    batches,
    alerts,
    retailers,
    simulation: {
      isRunning: false,
      tickIntervalSeconds: 4,
      lastTickAt: new Date().toISOString(),
      totalTicks: 0
    }
  };
}

function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = seedDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database, recreating seed:', err);
    const initial = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// -------------------------------------------------------------
// Server Application Setup
// -------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'AgroSense' });
});

// GET /api/specs - get product catalog specifications
app.get('/api/specs', (_req: Request, res: Response) => {
  res.json(PRODUCT_SPECS);
});

// GET /api/batches - list all batches
app.get('/api/batches', (req: Request, res: Response) => {
  const db = readDatabase();
  const { status, category, search } = req.query;
  
  let result = [...db.batches];
  
  if (status && typeof status === 'string' && status !== 'All') {
    result = result.filter(b => b.status.toLowerCase() === status.toLowerCase());
  }
  
  if (category && typeof category === 'string' && category !== 'All') {
    result = result.filter(b => b.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(b => 
      b.id.toLowerCase().includes(q) ||
      b.productName.toLowerCase().includes(q) ||
      b.carrier.toLowerCase().includes(q) ||
      b.origin.toLowerCase().includes(q) ||
      b.destination.toLowerCase().includes(q)
    );
  }

  res.json({
    batches: result,
    stats: {
      total: db.batches.length,
      healthy: db.batches.filter(b => b.status === 'Healthy').length,
      atRisk: db.batches.filter(b => b.status === 'At Risk').length,
      critical: db.batches.filter(b => b.status === 'Critical').length,
      expired: db.batches.filter(b => b.status === 'Expired').length,
      totalValueAtRisk: db.batches
        .filter(b => b.status === 'At Risk' || b.status === 'Critical')
        .reduce((sum, b) => {
          const spec = PRODUCT_SPECS[b.productKey] || { retailPricePerKg: 10 };
          return sum + (b.quantityKg * spec.retailPricePerKg);
        }, 0),
      totalSalvagedRevenue: db.batches.reduce((sum, b) => {
        if (b.liquidationOffer && b.liquidationOffer.status === 'Accepted') {
          return sum + b.liquidationOffer.salvagedRevenue;
        }
        return sum;
      }, 0),
      totalFoodSavedKg: db.batches.reduce((sum, b) => {
        if (b.liquidationOffer && b.liquidationOffer.status === 'Accepted') {
          return sum + b.liquidationOffer.foodSavedKg;
        }
        return sum;
      }, 0)
    }
  });
});

// GET /api/batches/:id - batch detail
app.get('/api/batches/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const batch = db.batches.find(b => b.id === req.params.id);
  if (!batch) {
    return res.status(404).json({ error: `Batch ${req.params.id} not found` });
  }
  const spec = PRODUCT_SPECS[batch.productKey];
  res.json({ batch, spec });
});

// POST /api/batches - create a new batch
app.post('/api/batches', (req: Request, res: Response) => {
  const {
    productKey,
    quantityKg,
    origin,
    destination,
    carrier,
    initialTemp,
    initialHumidity,
    totalExpectedTransitHours
  } = req.body;

  if (!productKey || !PRODUCT_SPECS[productKey]) {
    return res.status(400).json({ error: 'Valid productKey is required' });
  }

  const spec = PRODUCT_SPECS[productKey];
  const db = readDatabase();

  const id = `AGR-${Math.floor(1000 + Math.random() * 9000)}`;
  const temp = typeof initialTemp === 'number' ? initialTemp : (spec.optimalTempMin + spec.optimalTempMax) / 2;
  const hum = typeof initialHumidity === 'number' ? initialHumidity : (spec.optimalHumidityMin + spec.optimalHumidityMax) / 2;
  const transitHours = Number(totalExpectedTransitHours) || 36;
  const qty = Number(quantityKg) || 500;

  const factors = calculateAgingFactors(temp, hum, spec);
  const remainingDays = spec.baselineShelfLifeDays;
  const status = evaluateBatchStatus(remainingDays, spec.baselineShelfLifeDays, factors.combinedAgingFactor);
  const discountCalc = calculateDynamicDiscount(remainingDays, spec.baselineShelfLifeDays, status, factors.combinedAgingFactor, transitHours);

  const initialTelemetry: TelemetryPoint = {
    id: `tel-init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    temperature: temp,
    humidity: hum,
    transitDurationHours: 0,
    location: origin || 'Packaging Origin Facility',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    tempAgingFactor: factors.tempAgingFactor,
    humidityAgingFactor: factors.humidityAgingFactor,
    combinedAgingFactor: factors.combinedAgingFactor,
    remainingShelfLifeDays: remainingDays
  };

  const newBatch: Batch = {
    id,
    productKey,
    productName: spec.name,
    category: spec.category,
    quantityKg: qty,
    origin: origin || 'Salinas Valley, CA',
    destination: destination || 'Los Angeles, CA',
    currentLocation: origin || 'Packaging Origin Facility',
    transitProgressPercent: 0,
    totalExpectedTransitHours: transitHours,
    elapsedTransitHours: 0,
    carrier: carrier || 'AgroCold Logistics Premier',
    sensorId: `SNSR-${Math.floor(1000 + Math.random() * 9000)}`,
    startDate: new Date().toISOString(),
    currentTemp: temp,
    currentHumidity: hum,
    status,
    initialShelfLifeDays: spec.baselineShelfLifeDays,
    remainingShelfLifeDays: remainingDays,
    remainingShelfLifePercent: 100,
    cumulativeAgingDaysLost: 0,
    currentAgingVelocity: factors.combinedAgingFactor,
    tempAgingMultiplier: factors.tempAgingFactor,
    humidityAgingMultiplier: factors.humidityAgingFactor,
    recommendedDiscountPercent: discountCalc.recommendedDiscount,
    urgencyScore: discountCalc.urgencyScore,
    telemetryHistory: [initialTelemetry],
    hasBreach: false
  };

  db.batches.unshift(newBatch);
  writeDatabase(db);
  res.status(201).json(newBatch);
});

// POST /api/batches/:id/telemetry - ingest new telemetry point
app.post('/api/batches/:id/telemetry', (req: Request, res: Response) => {
  const { temperature, humidity, location } = req.body;
  const db = readDatabase();
  const batchIndex = db.batches.findIndex(b => b.id === req.params.id);
  
  if (batchIndex === -1) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  const batch = db.batches[batchIndex];
  const spec = PRODUCT_SPECS[batch.productKey];
  const newTemp = typeof temperature === 'number' ? temperature : batch.currentTemp;
  const newHum = typeof humidity === 'number' ? humidity : batch.currentHumidity;

  const factors = calculateAgingFactors(newTemp, newHum, spec);
  const timeStepHours = 2.0; // standard simulated interval
  const consumedDays = (timeStepHours / 24) * factors.combinedAgingFactor;
  const newRemainingDays = Math.max(0, Number((batch.remainingShelfLifeDays - consumedDays).toFixed(2)));
  const newLoss = Number((batch.cumulativeAgingDaysLost + (consumedDays - (timeStepHours / 24))).toFixed(2));
  
  const newStatus = evaluateBatchStatus(newRemainingDays, batch.initialShelfLifeDays, factors.combinedAgingFactor);
  const remainingHoursTransit = Math.max(0, batch.totalExpectedTransitHours - (batch.elapsedTransitHours + timeStepHours));
  const discountCalc = calculateDynamicDiscount(newRemainingDays, batch.initialShelfLifeDays, newStatus, factors.combinedAgingFactor, remainingHoursTransit);

  const newElapsed = batch.elapsedTransitHours + timeStepHours;
  const newProgress = Math.min(100, Math.round((newElapsed / batch.totalExpectedTransitHours) * 100));

  const point: TelemetryPoint = {
    id: `tel-${Date.now()}`,
    timestamp: new Date().toISOString(),
    temperature: newTemp,
    humidity: newHum,
    transitDurationHours: newElapsed,
    location: location || batch.currentLocation,
    coordinates: {
      lat: 36.0 + (newProgress * 0.03),
      lng: -121.0 - (newProgress * 0.02)
    },
    tempAgingFactor: factors.tempAgingFactor,
    humidityAgingFactor: factors.humidityAgingFactor,
    combinedAgingFactor: factors.combinedAgingFactor,
    remainingShelfLifeDays: newRemainingDays
  };

  batch.currentTemp = newTemp;
  batch.currentHumidity = newHum;
  batch.elapsedTransitHours = newElapsed;
  batch.transitProgressPercent = newProgress;
  batch.remainingShelfLifeDays = newRemainingDays;
  batch.remainingShelfLifePercent = Number(((newRemainingDays / batch.initialShelfLifeDays) * 100).toFixed(1));
  batch.cumulativeAgingDaysLost = newLoss;
  batch.currentAgingVelocity = factors.combinedAgingFactor;
  batch.tempAgingMultiplier = factors.tempAgingFactor;
  batch.humidityAgingMultiplier = factors.humidityAgingFactor;
  batch.status = newStatus;
  batch.recommendedDiscountPercent = discountCalc.recommendedDiscount;
  batch.urgencyScore = discountCalc.urgencyScore;
  batch.telemetryHistory.push(point);

  // Trigger alert if newly became at risk or critical
  if ((newStatus === 'Critical' || newStatus === 'At Risk') && !batch.hasBreach) {
    batch.hasBreach = true;
    batch.breachDescription = `Environmental excursion: Temp ${newTemp}°C, Humidity ${newHum}%. Aging rate accelerated to ${factors.combinedAgingFactor}x.`;
    
    db.alerts.unshift({
      id: `alt-${Date.now()}`,
      batchId: batch.id,
      batchName: batch.productName,
      severity: newStatus === 'Critical' ? 'CRITICAL' : 'WARNING',
      title: `${newStatus.toUpperCase()} Alert: ${batch.productName}`,
      message: `Degradation rate reached ${factors.combinedAgingFactor}x. Projected remaining shelf life: ${newRemainingDays} days. Recommended discount: ${discountCalc.recommendedDiscount}%.`,
      timestamp: new Date().toISOString(),
      resolved: false
    });
  }

  // Update liquidation offer
  if (discountCalc.recommendedDiscount > 0) {
    const defaultRetailer = db.retailers[0];
    const discountedPrice = Number((spec.retailPricePerKg * (1 - discountCalc.recommendedDiscount / 100)).toFixed(2));
    const totalOriginal = Number((batch.quantityKg * spec.retailPricePerKg).toFixed(2));
    const totalDiscounted = Number((batch.quantityKg * discountedPrice).toFixed(2));

    batch.liquidationOffer = {
      id: batch.liquidationOffer?.id || `liq-${Date.now()}`,
      retailerId: batch.liquidationOffer?.retailerId || defaultRetailer.id,
      retailerName: batch.liquidationOffer?.retailerName || defaultRetailer.name,
      recommendedDiscountPercent: discountCalc.recommendedDiscount,
      originalPricePerKg: spec.retailPricePerKg,
      discountedPricePerKg: discountedPrice,
      totalLotValueOriginal: totalOriginal,
      totalLotValueDiscounted: totalDiscounted,
      salvagedRevenue: totalDiscounted,
      foodSavedKg: batch.quantityKg,
      co2SavedKg: Number((batch.quantityKg * spec.carbonFootprintKgPerKg).toFixed(1)),
      urgency: discountCalc.urgencyScore > 80 ? 'Immediate' : discountCalc.urgencyScore > 50 ? 'High' : 'Medium',
      status: batch.liquidationOffer?.status || 'Pending'
    };
  }

  db.batches[batchIndex] = batch;
  writeDatabase(db);
  res.json({ batch, point });
});

// POST /api/batches/:id/breach - inject cold chain breach
app.post('/api/batches/:id/breach', (req: Request, res: Response) => {
  const { type } = req.body; // 'temp_high', 'humidity_drop', 'delay'
  const db = readDatabase();
  const batch = db.batches.find(b => b.id === req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  const spec = PRODUCT_SPECS[batch.productKey];
  let targetTemp = batch.currentTemp;
  let targetHum = batch.currentHumidity;
  let desc = '';

  if (type === 'humidity_drop') {
    targetHum = Math.max(45, spec.optimalHumidityMin - 22);
    desc = `Severe container dehumidification anomaly. RH dropped to ${targetHum}%. Rapid desiccation.`;
  } else if (type === 'restore') {
    targetTemp = (spec.optimalTempMin + spec.optimalTempMax) / 2;
    targetHum = (spec.optimalHumidityMin + spec.optimalHumidityMax) / 2;
    desc = 'Refrigeration unit restored to optimal setpoint.';
    batch.hasBreach = false;
  } else {
    // Default: severe thermal breach
    targetTemp = spec.criticalTempMax + 2.5;
    desc = `Thermal reefer failure. Temperature soared to ${targetTemp.toFixed(1)}°C (Safe limit: ${spec.criticalTempMax}°C).`;
  }

  batch.currentTemp = Number(targetTemp.toFixed(1));
  batch.currentHumidity = Math.round(targetHum);
  batch.hasBreach = type !== 'restore';
  batch.breachDescription = desc;

  const factors = calculateAgingFactors(batch.currentTemp, batch.currentHumidity, spec);
  const timeStepHours = 3.0;
  const consumedDays = (timeStepHours / 24) * factors.combinedAgingFactor;
  batch.remainingShelfLifeDays = Math.max(0, Number((batch.remainingShelfLifeDays - consumedDays).toFixed(2)));
  batch.cumulativeAgingDaysLost = Number((batch.cumulativeAgingDaysLost + (consumedDays - (timeStepHours / 24))).toFixed(2));
  batch.currentAgingVelocity = factors.combinedAgingFactor;
  batch.tempAgingMultiplier = factors.tempAgingFactor;
  batch.humidityAgingMultiplier = factors.humidityAgingFactor;
  batch.remainingShelfLifePercent = Number(((batch.remainingShelfLifeDays / batch.initialShelfLifeDays) * 100).toFixed(1));
  batch.status = evaluateBatchStatus(batch.remainingShelfLifeDays, batch.initialShelfLifeDays, factors.combinedAgingFactor);
  
  const discountCalc = calculateDynamicDiscount(batch.remainingShelfLifeDays, batch.initialShelfLifeDays, batch.status, factors.combinedAgingFactor, 12);
  batch.recommendedDiscountPercent = discountCalc.recommendedDiscount;
  batch.urgencyScore = discountCalc.urgencyScore;

  // Add history point
  batch.telemetryHistory.push({
    id: `tel-breach-${Date.now()}`,
    timestamp: new Date().toISOString(),
    temperature: batch.currentTemp,
    humidity: batch.currentHumidity,
    transitDurationHours: batch.elapsedTransitHours + timeStepHours,
    location: `${batch.currentLocation} (Anomaly)`,
    coordinates: { lat: 36.7, lng: -120.4 },
    tempAgingFactor: factors.tempAgingFactor,
    humidityAgingFactor: factors.humidityAgingFactor,
    combinedAgingFactor: factors.combinedAgingFactor,
    remainingShelfLifeDays: batch.remainingShelfLifeDays
  });

  if (type !== 'restore') {
    db.alerts.unshift({
      id: `alt-${Date.now()}`,
      batchId: batch.id,
      batchName: batch.productName,
      severity: batch.status === 'Critical' ? 'CRITICAL' : 'WARNING',
      title: `Breach Injected: ${batch.id}`,
      message: desc,
      timestamp: new Date().toISOString(),
      resolved: false
    });
  }

  writeDatabase(db);
  res.json({ batch, message: desc });
});

// POST /api/batches/:id/discounts/accept - accept liquidation offer
app.post('/api/batches/:id/discounts/accept', (req: Request, res: Response) => {
  const { retailerId, discountPercent } = req.body;
  const db = readDatabase();
  const batch = db.batches.find(b => b.id === req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  const retailer = db.retailers.find(r => r.id === retailerId) || db.retailers[0];
  const spec = PRODUCT_SPECS[batch.productKey];
  const discount = typeof discountPercent === 'number' ? discountPercent : batch.recommendedDiscountPercent;

  const discountedPrice = Number((spec.retailPricePerKg * (1 - discount / 100)).toFixed(2));
  const totalOriginal = Number((batch.quantityKg * spec.retailPricePerKg).toFixed(2));
  const totalDiscounted = Number((batch.quantityKg * discountedPrice).toFixed(2));

  batch.liquidationOffer = {
    id: `liq-${Date.now()}`,
    retailerId: retailer.id,
    retailerName: retailer.name,
    recommendedDiscountPercent: discount,
    originalPricePerKg: spec.retailPricePerKg,
    discountedPricePerKg: discountedPrice,
    totalLotValueOriginal: totalOriginal,
    totalLotValueDiscounted: totalDiscounted,
    salvagedRevenue: totalDiscounted,
    foodSavedKg: batch.quantityKg,
    co2SavedKg: Number((batch.quantityKg * spec.carbonFootprintKgPerKg).toFixed(1)),
    urgency: batch.urgencyScore > 80 ? 'Immediate' : 'High',
    status: 'Accepted',
    dispatchedAt: new Date().toISOString()
  };

  db.alerts.unshift({
    id: `alt-disc-${Date.now()}`,
    batchId: batch.id,
    batchName: batch.productName,
    severity: 'INFO',
    title: `Liquidation Dispatched to ${retailer.name}`,
    message: `${batch.quantityKg} kg allocated at ${discount}% discount. Salvaged revenue: $${totalDiscounted.toLocaleString()}. CO2 prevented: ${batch.liquidationOffer.co2SavedKg} kg.`,
    timestamp: new Date().toISOString(),
    resolved: true,
    resolvedAt: new Date().toISOString()
  });

  writeDatabase(db);
  res.json({ batch, liquidationOffer: batch.liquidationOffer });
});

// GET /api/alerts - list all alerts
app.get('/api/alerts', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.alerts);
});

// POST /api/alerts/:id/resolve - resolve alert
app.post('/api/alerts/:id/resolve', (req: Request, res: Response) => {
  const db = readDatabase();
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.resolved = true;
  alert.resolvedAt = new Date().toISOString();
  writeDatabase(db);
  res.json(alert);
});

// GET /api/retailers - list retail partners
app.get('/api/retailers', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.retailers);
});

// POST /api/simulate/tick - advance all active shipments by 1 simulated time step
app.post('/api/simulate/tick', (_req: Request, res: Response) => {
  const db = readDatabase();
  const timeStepHours = 1.5;

  db.batches.forEach(batch => {
    const spec = PRODUCT_SPECS[batch.productKey];
    if (!spec) return;

    // Add mild natural fluctuation (+/- 0.3 C, +/- 1.5% RH)
    let tempDelta = (Math.random() - 0.48) * 0.5;
    let humDelta = (Math.random() - 0.5) * 1.5;

    // If batch has a persistent breach, keep elevated
    if (batch.hasBreach) {
      tempDelta += 0.2;
    }

    const newTemp = Number(Math.max(-2, batch.currentTemp + tempDelta).toFixed(1));
    const newHum = Math.round(Math.min(99, Math.max(50, batch.currentHumidity + humDelta)));

    const factors = calculateAgingFactors(newTemp, newHum, spec);
    const consumedDays = (timeStepHours / 24) * factors.combinedAgingFactor;
    const newRemainingDays = Math.max(0, Number((batch.remainingShelfLifeDays - consumedDays).toFixed(2)));
    const newLoss = Number((batch.cumulativeAgingDaysLost + (consumedDays - (timeStepHours / 24))).toFixed(2));
    
    const newElapsed = batch.elapsedTransitHours + timeStepHours;
    const newProgress = Math.min(100, Math.round((newElapsed / batch.totalExpectedTransitHours) * 100));
    const newStatus = evaluateBatchStatus(newRemainingDays, batch.initialShelfLifeDays, factors.combinedAgingFactor);
    const remainingTransit = Math.max(0, batch.totalExpectedTransitHours - newElapsed);
    const discountCalc = calculateDynamicDiscount(newRemainingDays, batch.initialShelfLifeDays, newStatus, factors.combinedAgingFactor, remainingTransit);

    batch.currentTemp = newTemp;
    batch.currentHumidity = newHum;
    batch.elapsedTransitHours = newElapsed;
    batch.transitProgressPercent = newProgress;
    batch.remainingShelfLifeDays = newRemainingDays;
    batch.remainingShelfLifePercent = Number(((newRemainingDays / batch.initialShelfLifeDays) * 100).toFixed(1));
    batch.cumulativeAgingDaysLost = newLoss;
    batch.currentAgingVelocity = factors.combinedAgingFactor;
    batch.tempAgingMultiplier = factors.tempAgingFactor;
    batch.humidityAgingMultiplier = factors.humidityAgingFactor;
    batch.status = newStatus;
    batch.recommendedDiscountPercent = discountCalc.recommendedDiscount;
    batch.urgencyScore = discountCalc.urgencyScore;

    // Append telemetry
    batch.telemetryHistory.push({
      id: `tel-sim-${Date.now()}-${batch.id}`,
      timestamp: new Date().toISOString(),
      temperature: newTemp,
      humidity: newHum,
      transitDurationHours: newElapsed,
      location: batch.currentLocation,
      coordinates: {
        lat: 36.2 + (newProgress * 0.02),
        lng: -121.2 - (newProgress * 0.015)
      },
      tempAgingFactor: factors.tempAgingFactor,
      humidityAgingFactor: factors.humidityAgingFactor,
      combinedAgingFactor: factors.combinedAgingFactor,
      remainingShelfLifeDays: newRemainingDays
    });

    // Cap history at 60 points to avoid memory bloat
    if (batch.telemetryHistory.length > 60) {
      batch.telemetryHistory.shift();
    }
  });

  db.simulation.totalTicks += 1;
  db.simulation.lastTickAt = new Date().toISOString();

  writeDatabase(db);
  res.json({
    message: `Advanced simulation by ${timeStepHours} hours for ${db.batches.length} shipments`,
    totalTicks: db.simulation.totalTicks,
    batches: db.batches
  });
});

// POST /api/simulate/reset - reset database to seed
app.post('/api/simulate/reset', (_req: Request, res: Response) => {
  const initial = seedDatabase();
  writeDatabase(initial);
  res.json({ message: 'Database reset to default seed state', db: initial });
});

// -------------------------------------------------------------
// Vite Dev Server Integration
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'development') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AgroSense] Cold-chain platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[AgroSense] Failed to start server:', err);
  process.exit(1);
});
