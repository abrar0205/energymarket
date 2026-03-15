/**
 * WebSocket client – connects to the Python backend and bridges
 * incoming messages to the frontend event bus.
 *
 * If the backend is unreachable (e.g. on GitHub Pages), it automatically
 * falls back to an in-browser price simulator so the dashboard remains
 * fully interactive as a standalone demo.
 */

import { eventBus } from './eventBus';
import { startSimulator, stopSimulator } from './simulator';
import type { PriceTick, NormalizedPrice } from '../types';

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (import.meta.env.DEV
    ? `ws://${window.location.hostname}:8000/ws`
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

const MAX_RETRIES = 3; // fall back to simulator after this many failures

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
let usingSimulator = false;

function connect(): void {
  if (usingSimulator) return;
  if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.info('[WS] connected to backend');
    retryCount = 0;
    eventBus.publish('ws:status', 'connected');
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as {
        type: string;
        data: unknown;
      };
      if (msg.type === 'exchange_tick') {
        const tick = msg.data as PriceTick;
        eventBus.publish('exchange:tick', tick);
        eventBus.publish(`exchange:${tick.exchange}`, tick);
      } else if (msg.type === 'aggregated_price') {
        eventBus.publish('aggregated:price', msg.data as NormalizedPrice);
      }
    } catch {
      // ignore malformed messages
    }
  };

  socket.onclose = () => {
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      console.info(`[WS] backend unreachable after ${MAX_RETRIES} attempts – switching to demo mode`);
      activateSimulator();
      return;
    }
    console.warn(`[WS] disconnected – reconnecting (attempt ${retryCount}/${MAX_RETRIES})`);
    eventBus.publish('ws:status', 'disconnected');
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer || usingSimulator) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

function activateSimulator(): void {
  usingSimulator = true;
  startSimulator();
}

export function startBackendConnection(): void {
  retryCount = 0;
  usingSimulator = false;
  connect();
}

export function stopBackendConnection(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.onclose = null; // prevent reconnect on intentional close
    socket.close();
    socket = null;
  }
  if (usingSimulator) {
    stopSimulator();
    usingSimulator = false;
  }
}
