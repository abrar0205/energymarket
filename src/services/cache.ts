import { eventBus } from './eventBus';
import type { PriceTick, NormalizedPrice } from '../types';

const CACHE_KEY = 'energymarket:cache';
const MAX_TICKS = 100;

interface CacheState {
  recentTicks: PriceTick[];
  normalizedPrices: Record<string, NormalizedPrice>;
}

let state: CacheState = {
  recentTicks: [],
  normalizedPrices: {},
};

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      state = JSON.parse(raw) as CacheState;
    }
  } catch {
    // ignore parse errors
  }
}

function saveToStorage(): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function getRecentTicks(): PriceTick[] {
  return [...state.recentTicks];
}

export function getNormalizedPrices(): Record<string, NormalizedPrice> {
  return { ...state.normalizedPrices };
}

export function startCache(): () => void {
  loadFromStorage();

  const unsub1 = eventBus.subscribe('exchange:tick', (data) => {
    const tick = data as PriceTick;
    state.recentTicks.push(tick);
    if (state.recentTicks.length > MAX_TICKS) {
      state.recentTicks = state.recentTicks.slice(-MAX_TICKS);
    }
    saveToStorage();
  });

  const unsub2 = eventBus.subscribe('aggregated:price', (data) => {
    const normalized = data as NormalizedPrice;
    state.normalizedPrices[normalized.contract] = normalized;
    saveToStorage();
  });

  return () => {
    unsub1();
    unsub2();
  };
}
