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
  EEX: '#3ed8c3',
  ICE: '#2A78FF',
  Nasdaq: '#12875A',
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
      <h2>Price History</h2>
      {data.length === 0 ? (
        <p className="muted">Collecting data…</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="time" stroke="var(--chart-axis)" fontSize={12} tickLine={false} />
            <YAxis domain={['auto', 'auto']} stroke="var(--chart-axis)" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--chart-tooltip-border)',
                borderRadius: 10,
                color: 'var(--text)',
                boxShadow: '0 6px 20px rgba(11,18,32,0.08)',
                fontSize: 13,
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
