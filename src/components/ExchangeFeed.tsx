import { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';
import type { PriceTick, ExchangeName } from '../types';

const EXCHANGES: ExchangeName[] = ['EEX', 'ICE', 'Nasdaq'];
const MAX_ITEMS = 8;

export default function ExchangeFeed() {
  const [feeds, setFeeds] = useState<Record<ExchangeName, PriceTick[]>>({
    EEX: [],
    ICE: [],
    Nasdaq: [],
  });

  useEffect(() => {
    const unsubs = EXCHANGES.map((name) =>
      eventBus.subscribe(`exchange:${name}`, (data) => {
        const tick = data as PriceTick;
        setFeeds((prev) => ({
          ...prev,
          [name]: [tick, ...prev[name]].slice(0, MAX_ITEMS),
        }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div className="panel">
      <h2>🏛️ Exchange Feeds</h2>
      <div className="exchange-grid">
        {EXCHANGES.map((name) => (
          <div key={name} className="exchange-col">
            <h3 className={`exchange-name ex-${name.toLowerCase()}`}>{name}</h3>
            <div className="feed-list">
              {feeds[name].length === 0 ? (
                <span className="muted">Connecting…</span>
              ) : (
                feeds[name].map((tick, i) => (
                  <div key={i} className="feed-item">
                    <span className="feed-contract">{tick.contract}</span>
                    <span className="feed-price">€{tick.price.toFixed(2)}</span>
                    <span className="feed-volume">{tick.volume} MW</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
