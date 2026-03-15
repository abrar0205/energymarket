import { useEffect, useState } from 'react';
import type { NormalizedPrice } from '../types';
import { subscribeToRealtimePrices } from '../services/api';

export default function TickerCards() {
  const [prices, setPrices] = useState<Record<string, NormalizedPrice>>({});

  useEffect(() => {
    const unsub = subscribeToRealtimePrices((price) => {
      setPrices((prev) => ({ ...prev, [price.contract]: price }));
    });
    return unsub;
  }, []);

  const contracts = Object.values(prices);

  if (contracts.length === 0) {
    return (
      <div className="panel">
        <h2>📊 Live Ticker</h2>
        <p className="muted">Waiting for market data…</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>📊 Live Ticker</h2>
      <div className="ticker-grid">
        {contracts.map((p) => (
          <div key={p.contract} className="ticker-card">
            <div className="ticker-contract">{p.contract}</div>
            <div className="ticker-price">€{p.averagePrice.toFixed(2)}</div>
            <div className="ticker-meta">
              <span className="bid">Bid €{p.bestBid.toFixed(2)}</span>
              <span className="ask">Ask €{p.bestAsk.toFixed(2)}</span>
            </div>
            <div className="ticker-spread">
              Spread: €{(p.bestAsk - p.bestBid).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
