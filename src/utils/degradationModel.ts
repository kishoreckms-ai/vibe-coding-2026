import { ProductSpec, BatchStatus } from '../types';

export function calculateLocalAgingFactors(
  temp: number,
  humidity: number,
  spec: ProductSpec
): {
  tempAgingFactor: number;
  humidityAgingFactor: number;
  combinedAgingFactor: number;
  status: BatchStatus;
  explanation: {
    tempDetail: string;
    humDetail: string;
    summary: string;
  };
} {
  // Arrhenius / Q10
  let tempAging = 1.0;
  let tempDetail = 'Temperature is in optimal cold-chain baseline. Nominal aging rate (1.0x).';

  if (temp > spec.optimalTempMax) {
    const deltaT = temp - spec.optimalTempMax;
    tempAging = Math.pow(spec.q10Factor, deltaT / 10);
    
    if (temp > spec.criticalTempMax) {
      tempAging *= (1 + 0.20 * (temp - spec.criticalTempMax));
      tempDetail = `CRITICAL thermal abuse: ${temp.toFixed(1)}°C exceeds critical threshold of ${spec.criticalTempMax}°C. Severe microbial & enzymatic proliferation.`;
    } else {
      tempDetail = `Thermal excursion: ${temp.toFixed(1)}°C is ${deltaT.toFixed(1)}°C above optimal maximum (${spec.optimalTempMax}°C). Arrhenius Q10 accelerates decay.`;
    }
  } else if (temp < spec.optimalTempMin) {
    if (temp < -1.5) {
      tempAging = 2.0;
      tempDetail = `Sub-freezing hazard: ${temp.toFixed(1)}°C causes ice crystal formation and cellular wall rupture.`;
    } else {
      tempAging = 1.0;
      tempDetail = `Chilled safe zone (${temp.toFixed(1)}°C).`;
    }
  }

  // Humidity
  let humAging = 1.0;
  let humDetail = 'Relative humidity is in equilibrium. Minimal moisture gradient.';

  if (humidity < spec.optimalHumidityMin) {
    const deltaHum = spec.optimalHumidityMin - humidity;
    humAging = 1.0 + (deltaHum * spec.humiditySensitivity);
    humDetail = `Transpirational vapor deficit: ${humidity}% is below ${spec.optimalHumidityMin}%. Accelerates cellular water loss & wilting by ${(humAging).toFixed(2)}x.`;
  } else if (humidity > 98) {
    humAging = 1.0 + ((humidity - 98) * 0.12);
    humDetail = `Saturated condensation risk: Free moisture promotes fungal spore germination (Botrytis cinerea).`;
  }

  const combined = Number((tempAging * humAging).toFixed(2));
  
  let summary = `Product aging at ${combined}x normal speed. 24 hours in these conditions degrades freshness equal to ${(24 * combined).toFixed(1)} nominal hours.`;

  let status: BatchStatus = 'Healthy';
  if (combined >= 2.5 || temp > spec.criticalTempMax) {
    status = 'Critical';
  } else if (combined >= 1.5 || temp > spec.optimalTempMax + 1.0 || humidity < spec.optimalHumidityMin - 10) {
    status = 'At Risk';
  }

  return {
    tempAgingFactor: Number(tempAging.toFixed(2)),
    humidityAgingFactor: Number(humAging.toFixed(2)),
    combinedAgingFactor: combined,
    status,
    explanation: {
      tempDetail,
      humDetail,
      summary
    }
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function getStatusColor(status: BatchStatus): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
} {
  switch (status) {
    case 'Healthy':
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400'
      };
    case 'At Risk':
      return {
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400'
      };
    case 'Critical':
      return {
        bg: 'bg-rose-950/40',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400'
      };
    case 'Expired':
      return {
        bg: 'bg-neutral-900',
        text: 'text-neutral-400',
        border: 'border-neutral-700',
        badge: 'bg-neutral-800 text-neutral-400 border-neutral-700',
        dot: 'bg-neutral-500'
      };
  }
}
