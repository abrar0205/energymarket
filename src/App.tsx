import { useEffect } from 'react';
import TickerCards from './components/TickerCards';
import ExchangeFeed from './components/ExchangeFeed';
import AggregatedPrice from './components/AggregatedPrice';
import PriceChart from './components/PriceChart';
import SystemStatus from './components/SystemStatus';
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
        <h1>⚡ Energy Market Demo</h1>
        <p className="subtitle">
          Real-time energy trading dashboard — simulated exchange feeds,
          aggregation &amp; analytics
        </p>
      </header>
      <main className="dashboard">
        <TickerCards />
        <PriceChart />
        <AggregatedPrice />
        <ExchangeFeed />
        <SystemStatus />
      </main>
      <footer className="app-footer">
        <p>
          Energy Market Demo · Python FastAPI backend simulating AWS architecture
          (EventBridge, Lambda, ElastiCache, S3, API Gateway)
        </p>
      </footer>
    </div>
  );
}
