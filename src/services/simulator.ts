/**
 * Client-side price simulator – used when the Python backend is unreachable
 * (e.g. on GitHub Pages where only static files are served).
 *
 * Generates realistic-looking energy price ticks and aggregated data so the
 * dashboard remains fully interactive as a standalone demo.
 */

import { eventBus } from './eventBus';
import type { PriceTick, NormalizedPrice, ExchangeName } from '../types';

const EXCHANGES: ExchangeName[] = ['EEX', 'ICE', 'Nasdaq'];
const CONTRACT = 'Power Germany Base Year 2021';
const BASE_PRICE = 72.50;

// Track current prices per exchange for small random walks
const currentPrices: Record<ExchangeName, number> = {
  EEX: BASE_PRICE,
  ICE: BASE_PRICE + 0.15,
  Nasdaq: BASE_PRICE - 0.10,
};

/** Small random walk: ±0.03 to ±0.10 */
function smallDelta(): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * (0.03 + Math.random() * 0.07);
}

// Track latest per-exchange prices for aggregation
const latestPrices: Record<ExchangeName, number> = { ...currentPrices };

let timers: ReturnType<typeof setTimeout>[] = [];
let running = false;

function emitTick(): void {
  const exchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  const delta = smallDelta();
  currentPrices[exchange] = +(currentPrices[exchange] + delta).toFixed(2);
  const price = currentPrices[exchange];
  const volume = Math.floor(Math.random() * 500) + 50;

  const tick: PriceTick = {
    exchange,
    contract: CONTRACT,
    price,
    volume,
    timestamp: Date.now(),
  };

  // Update tracking
  latestPrices[exchange] = price;

  // Publish tick
  eventBus.publish('exchange:tick', tick);
  eventBus.publish(`exchange:${exchange}`, tick);

  // Build aggregated price
  const prices = Object.values(latestPrices);
  const avg = +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  const normalized: NormalizedPrice = {
    contract: CONTRACT,
    averagePrice: avg,
    bestBid: lowestPrice,
    bestAsk: highestPrice,
    latestPrice: price,
    latestExchange: exchange,
    timestamp: Date.now(),
    exchangePrices: { ...latestPrices },
  };

  eventBus.publish('aggregated:price', normalized);

  // Store for historical API fallback – one point per exchange
  addHistoryPoint({ timestamp: Date.now(), price, contract: exchange });
}

// ----- In-memory historical store (for chart) -----

interface HistPoint {
  timestamp: number;
  price: number;
  contract: string;
}

const history: HistPoint[] = [];
const MAX_HISTORY = 500;

function addHistoryPoint(pt: HistPoint): void {
  history.push(pt);
  if (history.length > MAX_HISTORY) history.shift();
}

export function getSimulatedHistory(contract?: string): HistPoint[] {
  if (contract) return history.filter((h) => h.contract === contract);
  return [...history];
}

// ----- Simulated system status -----

let tickCount = 0;

export function getSimulatedStatus() {
  return {
    tickCounts: { EEX: tickCount, ICE: tickCount, Nasdaq: tickCount },
    totalTicks: tickCount * 3,
    aggCount: tickCount * 3,
    components: [
      { name: 'EEX Exchange Feed', status: 'healthy' as const, description: 'Simulated EEX power exchange (browser)', awsEquivalent: 'External API → EventBridge' },
      { name: 'ICE Exchange Feed', status: 'healthy' as const, description: 'Simulated ICE futures exchange (browser)', awsEquivalent: 'External API → EventBridge' },
      { name: 'Nasdaq Exchange Feed', status: 'healthy' as const, description: 'Simulated Nasdaq commodities (browser)', awsEquivalent: 'External API → EventBridge' },
      { name: 'Event Bus', status: 'healthy' as const, description: 'In-browser pub/sub message broker', awsEquivalent: 'Amazon EventBridge' },
      { name: 'Aggregation Service', status: 'healthy' as const, description: 'Client-side price aggregation', awsEquivalent: 'AWS Lambda' },
      { name: 'Recent Cache', status: 'healthy' as const, description: 'In-memory browser cache', awsEquivalent: 'Amazon ElastiCache (Redis)' },
      { name: 'Historical Store', status: 'healthy' as const, description: 'Browser-side rolling history', awsEquivalent: 'Amazon S3' },
      { name: 'API Layer', status: 'healthy' as const, description: 'Static demo mode (no backend)', awsEquivalent: 'API Gateway + WebSocket' },
    ],
  };
}

// ----- Start / stop -----

export function startSimulator(): void {
  if (running) return;
  running = true;
  console.info('[Simulator] backend unreachable – running in demo mode');
  eventBus.publish('ws:status', 'demo');

  // Emit ticks at random 1–3s intervals
  function scheduleNext(): void {
    const delay = 1000 + Math.random() * 2000;
    const id = setTimeout(() => {
      if (!running) return;
      emitTick();
      tickCount++;
      scheduleNext();
    }, delay);
    timers.push(id);
  }

  // Start multiple concurrent streams for realism
  for (let i = 0; i < 3; i++) {
    scheduleNext();
  }
}

export function stopSimulator(): void {
  running = false;
  timers.forEach(clearTimeout);
  timers = [];
}

export function isSimulatorRunning(): boolean {
  return running;
}
