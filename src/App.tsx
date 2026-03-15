import { useEffect, useState } from 'react';
import ExchangeFeed from './components/ExchangeFeed';
import PriceChart from './components/PriceChart';
import { startBackendConnection, stopBackendConnection } from './services/exchanges';
import { eventBus } from './services/eventBus';
import type { PriceTick } from './types';
import './App.css';

export default function App() {
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    startBackendConnection();
    const unsub = eventBus.subscribe('exchange:tick', (data) => {
      const tick = data as PriceTick;
      setLastUpdate((prev) => {
        const prevSec = prev ? Math.floor(prev / 1000) : 0;
        const newSec = Math.floor(tick.timestamp / 1000);
        return newSec !== prevSec ? tick.timestamp : prev;
      });
    });
    return () => {
      stopBackendConnection();
      unsub();
    };
  }, []);

  function formatDateTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>RWE Energy Trader Dashboard</h1>
          <p className="subtitle">
            Power Germany Base Year 2021 — Simulated Live Market View
          </p>
        </div>
        <div className="header-right">
          <span className="status-badge">● Simulated Live Feed</span>
          {lastUpdate && (
            <span className="last-update">
              Last Market Update: {formatDateTime(lastUpdate)}
            </span>
          )}
        </div>
      </header>
      <main className="dashboard">
        <ExchangeFeed />
        <PriceChart />
      </main>
      <footer className="app-footer">
        <p>RWE Energy Trading · Simulated Market Data</p>
      </footer>
    </div>
  );
}
