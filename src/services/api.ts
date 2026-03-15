import { eventBus } from './eventBus';
import { getHistory } from './historicalStore';
import { getNormalizedPrices } from './cache';
import type { NormalizedPrice, HistoricalPoint } from '../types';

export function getHistoricalPrices(contract?: string): HistoricalPoint[] {
  return getHistory(contract);
}

export function subscribeToRealtimePrices(
  callback: (price: NormalizedPrice) => void
): () => void {
  return eventBus.subscribe('aggregated:price', (data) => {
    callback(data as NormalizedPrice);
  });
}

export function getLatestPrices(): Record<string, NormalizedPrice> {
  return getNormalizedPrices();
}
