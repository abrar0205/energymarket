import { useMemo } from 'react';
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

const EXCHANGES = ['EEX', 'ICE', 'Nasdaq'] as const;
const COLORS: Record<string, string> = {
  EEX: '#3ed8c3',
  ICE: '#2A78FF',
  Nasdaq: '#12875A',
};

interface DailyRow {
  date: string;
  EEX: number;
  ICE: number;
  Nasdaq: number;
}

/** Seed-based pseudo-random number generator for deterministic data */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateHistoricalData(): DailyRow[] {
  const rand = seededRandom(42);
  const rows: DailyRow[] = [];
  const today = new Date();

  const bases = { EEX: 72.5, ICE: 72.8, Nasdaq: 72.3 };

  for (let i = 5; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    const row: DailyRow = {
      date: label,
      EEX: +(bases.EEX + (rand() - 0.5) * 1.6).toFixed(2),
      ICE: +(bases.ICE + (rand() - 0.5) * 1.6).toFixed(2),
      Nasdaq: +(bases.Nasdaq + (rand() - 0.5) * 1.6).toFixed(2),
    };

    rows.push(row);
  }

  return rows;
}

export default function HistoricalChart() {
  const data = useMemo(() => generateHistoricalData(), []);

  return (
    <div className="panel historical-panel">
      <h2>5-Day Price History</h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v: number) => `€${v.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: 10,
              color: 'var(--text)',
              boxShadow: '0 6px 20px rgba(11,18,32,0.08)',
              fontSize: 13,
            }}
            formatter={(value: number) => [`€${value.toFixed(2)}`, undefined]}
          />
          <Legend />
          {EXCHANGES.map((ex) => (
            <Line
              key={ex}
              type="monotone"
              dataKey={ex}
              stroke={COLORS[ex]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
