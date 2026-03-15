/**
 * API service – thin REST + event-bus client that talks to the Python backend.
 *
 * Simulates API Gateway + WebSocket on the AWS architecture diagram.
 */

import { eventBus } from './eventBus';
import type { NormalizedPrice, HistoricalPoint } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export async function getHistoricalPrices(
  contract?: string,
): Promise<HistoricalPoint[]> {
  const params = contract ? `?contract=${encodeURIComponent(contract)}` : '';
  const res = await fetch(`${API_BASE}/api/historical${params}`);
  return (await res.json()) as HistoricalPoint[];
}

export function subscribeToRealtimePrices(
  callback: (price: NormalizedPrice) => void,
): () => void {
  return eventBus.subscribe('aggregated:price', (data) => {
    callback(data as NormalizedPrice);
  });
}

export async function getLatestPrices(): Promise<
  Record<string, NormalizedPrice>
> {
  const res = await fetch(`${API_BASE}/api/prices`);
  return (await res.json()) as Record<string, NormalizedPrice>;
}
