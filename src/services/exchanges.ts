import { eventBus } from './eventBus';
import type { PriceTick, ExchangeName } from '../types';

const CONTRACTS = ['Base-2026-Q1', 'Peak-2026-Q2', 'Base-2026-Cal'];

interface ExchangeConfig {
  name: ExchangeName;
  basePrice: Record<string, number>;
  volatility: number;
  minInterval: number;
  maxInterval: number;
}

const EXCHANGE_CONFIGS: ExchangeConfig[] = [
  {
    name: 'EEX',
    basePrice: { 'Base-2026-Q1': 72.5, 'Peak-2026-Q2': 89.3, 'Base-2026-Cal': 68.1 },
    volatility: 0.8,
    minInterval: 1000,
    maxInterval: 3000,
  },
  {
    name: 'ICE',
    basePrice: { 'Base-2026-Q1': 72.8, 'Peak-2026-Q2': 89.1, 'Base-2026-Cal': 68.4 },
    volatility: 1.0,
    minInterval: 1000,
    maxInterval: 2500,
  },
  {
    name: 'Nasdaq',
    basePrice: { 'Base-2026-Q1': 72.3, 'Peak-2026-Q2': 89.5, 'Base-2026-Cal': 67.9 },
    volatility: 0.6,
    minInterval: 1500,
    maxInterval: 3000,
  },
];

const currentPrices: Record<string, Record<string, number>> = {};

function generateTick(config: ExchangeConfig): PriceTick {
  const contract = CONTRACTS[Math.floor(Math.random() * CONTRACTS.length)];

  if (!currentPrices[config.name]) {
    currentPrices[config.name] = { ...config.basePrice };
  }

  const current = currentPrices[config.name][contract];
  const change = (Math.random() - 0.5) * 2 * config.volatility;
  const newPrice = Math.max(10, current + change);
  currentPrices[config.name][contract] = newPrice;

  return {
    exchange: config.name,
    contract,
    price: Math.round(newPrice * 100) / 100,
    volume: Math.floor(Math.random() * 500) + 50,
    timestamp: Date.now(),
  };
}

const timers: ReturnType<typeof setTimeout>[] = [];

function startExchange(config: ExchangeConfig): void {
  function emit() {
    const tick = generateTick(config);
    eventBus.publish('exchange:tick', tick);
    eventBus.publish(`exchange:${config.name}`, tick);
    const delay =
      config.minInterval +
      Math.random() * (config.maxInterval - config.minInterval);
    const timer = setTimeout(emit, delay);
    timers.push(timer);
  }
  emit();
}

export function startAllExchanges(): void {
  EXCHANGE_CONFIGS.forEach(startExchange);
}

export function stopAllExchanges(): void {
  timers.forEach(clearTimeout);
  timers.length = 0;
}
