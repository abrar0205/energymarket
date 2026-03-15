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

const CONTRACTS = ['Base-2026-Q1', 'Peak-2026-Q2', 'Base-2026-Cal'];
const COLORS: Record<string, string> = {
  'Base-2026-Q1': '#00d4ff',
  'Peak-2026-Q2': '#ff6b6b',
  'Base-2026-Cal': '#51cf66',
};

interface ChartRow {
  time: string;
  [contract: string]: string | number;
}

function buildChartData(history: HistoricalPoint[]): ChartRow[] {
  const byTime = new Map<number, ChartRow>();
  const bucket = 2000; // group into 2s buckets

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

  return Array.from(byTime.values()).slice(-50);
}

export default function PriceChart() {
  const [data, setData] = useState<ChartRow[]>([]);

  useEffect(() => {
    // Fetch initial history from the Python backend
    getHistoricalPrices()
      .then((h) => setData(buildChartData(h)))
      .catch((err) => console.warn('Failed to load historical prices:', err));

    // Refresh chart on each new aggregated price
    const unsub = subscribeToRealtimePrices(() => {
      getHistoricalPrices()
        .then((h) => setData(buildChartData(h)))
        .catch((err) => console.warn('Failed to refresh chart data:', err));
    });
    return unsub;
  }, []);

  return (
    <div className="panel">
      <h2>📈 Price History</h2>
      {data.length === 0 ? (
        <p className="muted">Collecting data…</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" fontSize={11} />
            <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: 8,
              }}
            />
            <Legend />
            {CONTRACTS.map((c) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={COLORS[c]}
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
