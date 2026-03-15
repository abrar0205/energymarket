import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getHistoricalPrices, subscribeToRealtimePrices } from '../services/api';
import type { HistoricalPoint } from '../types';

const EXCHANGES = ['EEX', 'ICE', 'Nasdaq'];
const COLORS: Record<string, string> = {
  EEX: '#4a90d9',
  ICE: '#c97b3a',
  Nasdaq: '#5cb87a',
};

const MAX_POINTS = 25;

interface ChartRow {
  time: string;
  [exchange: string]: string | number;
}

function buildChartData(history: HistoricalPoint[]): ChartRow[] {
  const byTime = new Map<number, ChartRow>();
  const bucket = 2000;

  for (const pt of history) {
    const key = Math.floor(pt.timestamp / bucket) * bucket;
    if (!byTime.has(key)) {
      const d = new Date(key);
      byTime.set(key, {
        time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
      });
    }
    byTime.get(key)![pt.contract] = pt.price;
  }

  return Array.from(byTime.values()).slice(-MAX_POINTS);
}

export default function PriceChart() {
  const [data, setData] = useState<ChartRow[]>([]);

  useEffect(() => {
    getHistoricalPrices()
      .then((h) => setData(buildChartData(h)))
      .catch((err) => console.warn('Failed to load historical prices:', err));

    const unsub = subscribeToRealtimePrices(() => {
      getHistoricalPrices()
        .then((h) => setData(buildChartData(h)))
        .catch((err) => console.warn('Failed to refresh chart data:', err));
    });
    return unsub;
  }, []);

  return (
    <div className="panel">
      <h2>Price History — Last {MAX_POINTS} Data Points</h2>
      {data.length === 0 ? (
        <p className="muted">Collecting data…</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3356" />
            <XAxis dataKey="time" stroke="#5a6f8a" fontSize={11} />
            <YAxis domain={['auto', 'auto']} stroke="#5a6f8a" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: '#111d33',
                border: '1px solid #1e3356',
                borderRadius: 6,
                color: '#d8dee9',
              }}
            />
            <Legend />
            {EXCHANGES.map((ex) => (
              <Line
                key={ex}
                type="monotone"
                dataKey={ex}
                stroke={COLORS[ex]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
