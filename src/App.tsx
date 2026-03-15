import { useEffect } from 'react';
import TickerCards from './components/TickerCards';
import ExchangeFeed from './components/ExchangeFeed';
import AggregatedPrice from './components/AggregatedPrice';
import PriceChart from './components/PriceChart';
import SystemStatus from './components/SystemStatus';
import { startAllExchanges, stopAllExchanges } from './services/exchanges';
import { startAggregator } from './services/aggregator';
import { startCache } from './services/cache';
import { startHistoricalStore } from './services/historicalStore';
import './App.css';

export default function App() {
  useEffect(() => {
    startAllExchanges();
    const stopAgg = startAggregator();
    const stopCache = startCache();
    const stopHistory = startHistoricalStore();

    return () => {
      stopAllExchanges();
      stopAgg();
      stopCache();
      stopHistory();
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ Energy Market Demo</h1>
        <p className="subtitle">
          Real-time energy trading dashboard — simulated exchange feeds,
          aggregation & analytics
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
          Energy Market Demo · Simulates AWS architecture (EventBridge, Lambda,
          ElastiCache, S3, API Gateway) using frontend-only components
        </p>
      </footer>
    </div>
  );
}
