import { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';
import type { PriceTick, ExchangeName } from '../types';

const EXCHANGES: ExchangeName[] = ['EEX', 'ICE', 'Nasdaq'];

interface ExchangeState {
  price: number;
  prevPrice: number;
  timestamp: number;
}

export default function ExchangeFeed() {
  const [state, setState] = useState<Record<ExchangeName, ExchangeState | null>>({
    EEX: null,
    ICE: null,
    Nasdaq: null,
  });

  useEffect(() => {
    const unsubs = EXCHANGES.map((name) =>
      eventBus.subscribe(`exchange:${name}`, (data) => {
        const tick = data as PriceTick;
        setState((prev) => ({
          ...prev,
          [name]: {
            price: tick.price,
            prevPrice: prev[name]?.price ?? tick.price,
            timestamp: tick.timestamp,
          },
        }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const activePrices = EXCHANGES
    .map((name) => ({ name, state: state[name] }))
    .filter((e): e is { name: ExchangeName; state: ExchangeState } => e.state !== null);

  const bestExchange = activePrices.length > 0
    ? activePrices.reduce((best, cur) => cur.state.price < best.state.price ? cur : best).name
    : null;

  const aggregated = activePrices.length > 0
    ? (() => {
        const prices = activePrices.map((e) => e.state.price);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const bestBid = Math.min(...prices);
        const bestAsk = Math.max(...prices);
        return { avg, bestBid, bestAsk, spread: bestAsk - bestBid };
      })()
    : null;

  return (
    <div className="panel">
      <h2>Power Germany Base Year 2021 — Exchange Comparison</h2>
      <div className="exchange-grid">
        {EXCHANGES.map((name) => {
          const s = state[name];
          if (!s) {
            return (
              <div key={name} className="exchange-card">
                <div className="exchange-card-header">
                  <span className="exchange-label">{name}</span>
                </div>
                <div className="exchange-price">—</div>
                <span className="muted">Connecting…</span>
              </div>
            );
          }
          const delta = +(s.price - s.prevPrice).toFixed(2);
          const deltaClass = delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-flat';
          const deltaSign = delta > 0 ? '+' : '';
          const isBest = bestExchange === name;

          return (
            <div key={name} className={`exchange-card${isBest ? ' exchange-card-best' : ''}`}>
              <div className="exchange-card-header">
                <span className="exchange-label">
                  {name}
                  {isBest && <span className="best-badge">⭐ Best Price</span>}
                </span>
              </div>
              <div className="exchange-price">€{s.price.toFixed(2)}</div>
              <span className={`exchange-delta ${deltaClass}`}>
                {deltaSign}€{delta.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {aggregated && (
        <div className="aggregated-widget">
          <h3 className="aggregated-title">Aggregated Market Price</h3>
          <div className="aggregated-grid">
            <div className="aggregated-item">
              <span className="aggregated-label">Average Price</span>
              <span className="aggregated-value">€{aggregated.avg.toFixed(2)}</span>
            </div>
            <div className="aggregated-item">
              <span className="aggregated-label">Best Bid</span>
              <span className="aggregated-value aggregated-bid">€{aggregated.bestBid.toFixed(2)}</span>
            </div>
            <div className="aggregated-item">
              <span className="aggregated-label">Best Ask</span>
              <span className="aggregated-value aggregated-ask">€{aggregated.bestAsk.toFixed(2)}</span>
            </div>
            <div className="aggregated-item">
              <span className="aggregated-label">Spread</span>
              <span className="aggregated-value">€{aggregated.spread.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {bestExchange && (
        <div className="best-exchange-widget">
          Best Exchange Right Now: <strong>{bestExchange}</strong>
        </div>
      )}
    </div>
  );
}
