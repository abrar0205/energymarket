import { eventBus } from './eventBus';
import type { PriceTick, NormalizedPrice, ExchangeName } from '../types';

const latestByExchange: Record<string, Record<ExchangeName, PriceTick>> = {};

function normalize(): void {
  const contracts = Object.keys(latestByExchange);
  for (const contract of contracts) {
    const exchangeData = latestByExchange[contract];
    const entries = Object.values(exchangeData);
    if (entries.length === 0) continue;

    const prices = entries.map((e) => e.price);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const latest = entries.reduce((a, b) =>
      a.timestamp > b.timestamp ? a : b
    );

    const exchangePrices: Record<ExchangeName, number> = {} as Record<ExchangeName, number>;
    for (const e of entries) {
      exchangePrices[e.exchange] = e.price;
    }

    const normalized: NormalizedPrice = {
      contract,
      averagePrice: Math.round(avg * 100) / 100,
      bestBid: Math.round(Math.min(...prices) * 100) / 100,
      bestAsk: Math.round(Math.max(...prices) * 100) / 100,
      latestPrice: latest.price,
      latestExchange: latest.exchange,
      timestamp: Date.now(),
      exchangePrices,
    };

    eventBus.publish('aggregated:price', normalized);
  }
}

export function startAggregator(): () => void {
  const unsub = eventBus.subscribe('exchange:tick', (data) => {
    const tick = data as PriceTick;
    if (!latestByExchange[tick.contract]) {
      latestByExchange[tick.contract] = {} as Record<ExchangeName, PriceTick>;
    }
    latestByExchange[tick.contract][tick.exchange] = tick;
    normalize();
  });

  return unsub;
}
