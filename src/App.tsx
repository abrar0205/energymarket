import { useEffect, useState } from 'react';
import ExchangeFeed from './components/ExchangeFeed';
import PriceChart from './components/PriceChart';
import HistoricalChart from './components/HistoricalChart';
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
      setLastUpdate(tick.timestamp);
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
          <div className="brand-row">
            <img
              src="/rwe-logo.png"
              alt="RWE logo"
              className="rwe-logo"
            />
            <h1>RWE Supply &amp; Trading - Trader Dashboard</h1>
          </div>
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
      <section className="historical-section">
        <HistoricalChart />
      </section>
      <footer className="app-footer">
        <p>RWE Supply and trading - Simulated Market view</p>
      </footer>
    </div>
  );
}
