import { useEffect } from 'react';
import ExchangeFeed from './components/ExchangeFeed';
import PriceChart from './components/PriceChart';
import { startBackendConnection, stopBackendConnection } from './services/exchanges';
import './App.css';

export default function App() {
  useEffect(() => {
    startBackendConnection();
    return () => {
      stopBackendConnection();
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>RWE Energy Trader Dashboard</h1>
          <p className="subtitle">
            Power Germany Base Year 2021 — Simulated Live Market View
          </p>
        </div>
        <span className="status-badge">● Simulated Live Feed</span>
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
