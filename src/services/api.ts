/**
 * API service – thin REST + event-bus client that talks to the Python backend.
 *
 * When the backend is unreachable (e.g. on GitHub Pages), all REST calls
 * gracefully fall back to data produced by the in-browser simulator.
 *
 * Simulates API Gateway + WebSocket on the AWS architecture diagram.
 */

import { eventBus } from './eventBus';
import { getSimulatedHistory, getSimulatedStatus, isSimulatorRunning } from './simulator';
import type { NormalizedPrice, HistoricalPoint } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export async function getHistoricalPrices(
  contract?: string,
): Promise<HistoricalPoint[]> {
  // If the simulator is active, return its local history directly
  if (isSimulatorRunning()) {
    return getSimulatedHistory(contract);
  }
  try {
    const params = contract ? `?contract=${encodeURIComponent(contract)}` : '';
    const res = await fetch(`${API_BASE}/api/historical${params}`);
    return (await res.json()) as HistoricalPoint[];
  } catch {
    return getSimulatedHistory(contract);
  }
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
  try {
    const res = await fetch(`${API_BASE}/api/prices`);
    return (await res.json()) as Record<string, NormalizedPrice>;
  } catch {
    return {};
  }
}

export async function getSystemStatus() {
  if (isSimulatorRunning()) {
    return getSimulatedStatus();
  }
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    return await res.json();
  } catch {
    return getSimulatedStatus();
  }
}
