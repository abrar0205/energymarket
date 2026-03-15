/**
 * WebSocket client – connects to the Python backend and bridges
 * incoming messages to the frontend event bus.
 *
 * The Python backend runs the actual exchange feeds, aggregation,
 * cache and historical store.  This module simply receives the data.
 */

import { eventBus } from './eventBus';
import type { PriceTick, NormalizedPrice } from '../types';

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (import.meta.env.DEV
    ? `ws://${window.location.hostname}:8000/ws`
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect(): void {
  if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.info('[WS] connected to backend');
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
    console.warn('[WS] disconnected – reconnecting in 2 s');
    eventBus.publish('ws:status', 'disconnected');
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

export function startBackendConnection(): void {
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
}
