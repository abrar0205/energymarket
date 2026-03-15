export interface PriceTick {
  exchange: ExchangeName;
  contract: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface NormalizedPrice {
  contract: string;
  averagePrice: number;
  bestBid: number;
  bestAsk: number;
  latestPrice: number;
  latestExchange: ExchangeName;
  timestamp: number;
  exchangePrices: Record<ExchangeName, number>;
}

export interface HistoricalPoint {
  timestamp: number;
  price: number;
  contract: string;
}

export type ExchangeName = 'EEX' | 'ICE' | 'Nasdaq';

export interface SystemComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  description: string;
  awsEquivalent: string;
  tickCount?: number;
  lastUpdate?: number;
}
