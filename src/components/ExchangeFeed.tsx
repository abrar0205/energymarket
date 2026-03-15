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

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

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

          return (
            <div key={name} className="exchange-card">
              <div className="exchange-card-header">
                <span className="exchange-label">{name}</span>
                <span className="exchange-time">{formatTime(s.timestamp)}</span>
              </div>
              <div className="exchange-price">€{s.price.toFixed(2)}</div>
              <span className={`exchange-delta ${deltaClass}`}>
                {deltaSign}€{delta.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
