import { useEffect, useState } from 'react';
import type { NormalizedPrice, ExchangeName } from '../types';
import { subscribeToRealtimePrices } from '../services/api';

const EXCHANGES: ExchangeName[] = ['EEX', 'ICE', 'Nasdaq'];

export default function AggregatedPrice() {
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
        <h2>⚡ Aggregated Market</h2>
        <p className="muted">Aggregating prices…</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>⚡ Aggregated Market</h2>
      <table className="market-table">
        <thead>
          <tr>
            <th>Contract</th>
            {EXCHANGES.map((ex) => (
              <th key={ex}>{ex}</th>
            ))}
            <th>Avg</th>
            <th>Best Bid</th>
            <th>Best Ask</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((p) => (
            <tr key={p.contract}>
              <td className="contract-name">{p.contract}</td>
              {EXCHANGES.map((ex) => (
                <td key={ex}>
                  {p.exchangePrices[ex]
                    ? `€${p.exchangePrices[ex].toFixed(2)}`
                    : '—'}
                </td>
              ))}
              <td className="avg-price">€{p.averagePrice.toFixed(2)}</td>
              <td className="bid">€{p.bestBid.toFixed(2)}</td>
              <td className="ask">€{p.bestAsk.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
