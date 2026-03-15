import { eventBus } from './eventBus';
import type { NormalizedPrice, HistoricalPoint } from '../types';

const STORAGE_KEY = 'energymarket:history';
const MAX_POINTS = 200;

let history: HistoricalPoint[] = [];

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      history = JSON.parse(raw) as HistoricalPoint[];
    }
  } catch {
    // ignore
  }
}

function saveToStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function getHistory(contract?: string): HistoricalPoint[] {
  if (contract) {
    return history.filter((p) => p.contract === contract);
  }
  return [...history];
}

export function startHistoricalStore(): () => void {
  loadFromStorage();

  const unsub = eventBus.subscribe('aggregated:price', (data) => {
    const norm = data as NormalizedPrice;
    history.push({
      timestamp: norm.timestamp,
      price: norm.averagePrice,
      contract: norm.contract,
    });
    if (history.length > MAX_POINTS) {
      history = history.slice(-MAX_POINTS);
    }
    saveToStorage();
  });

  return unsub;
}
