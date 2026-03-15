import { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';
import type { SystemComponent, PriceTick } from '../types';

const INITIAL_COMPONENTS: SystemComponent[] = [
  {
    name: 'EEX Exchange Feed',
    status: 'offline',
    description: 'Simulated EEX power exchange',
    awsEquivalent: 'External API → EventBridge',
  },
  {
    name: 'ICE Exchange Feed',
    status: 'offline',
    description: 'Simulated ICE futures exchange',
    awsEquivalent: 'External API → EventBridge',
  },
  {
    name: 'Nasdaq Exchange Feed',
    status: 'offline',
    description: 'Simulated Nasdaq commodities',
    awsEquivalent: 'External API → EventBridge',
  },
  {
    name: 'Event Bus',
    status: 'healthy',
    description: 'Internal pub/sub message broker',
    awsEquivalent: 'Amazon EventBridge',
  },
  {
    name: 'Aggregation Service',
    status: 'healthy',
    description: 'Price normalization & computation',
    awsEquivalent: 'AWS Lambda',
  },
  {
    name: 'Recent Cache',
    status: 'healthy',
    description: 'In-memory + localStorage cache',
    awsEquivalent: 'Amazon ElastiCache (Redis)',
  },
  {
    name: 'Historical Store',
    status: 'healthy',
    description: 'Rolling price history',
    awsEquivalent: 'Amazon S3',
  },
  {
    name: 'API Layer',
    status: 'healthy',
    description: 'Frontend service functions',
    awsEquivalent: 'API Gateway + WebSocket',
  },
];

export default function SystemStatus() {
  const [components, setComponents] = useState<SystemComponent[]>(INITIAL_COMPONENTS);
  const [tickCounts, setTickCounts] = useState<Record<string, number>>({
    EEX: 0,
    ICE: 0,
    Nasdaq: 0,
  });
  const [aggCount, setAggCount] = useState(0);

  useEffect(() => {
    const unsub1 = eventBus.subscribe('exchange:tick', (data) => {
      const tick = data as PriceTick;
      setTickCounts((prev) => ({
        ...prev,
        [tick.exchange]: (prev[tick.exchange] || 0) + 1,
      }));
      setComponents((prev) =>
        prev.map((c) =>
          c.name === `${tick.exchange} Exchange Feed`
            ? { ...c, status: 'healthy' as const, lastUpdate: Date.now() }
            : c
        )
      );
    });

    const unsub2 = eventBus.subscribe('aggregated:price', () => {
      setAggCount((c) => c + 1);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const totalTicks = Object.values(tickCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="panel">
      <h2>🖥️ System Status</h2>
      <div className="status-summary">
        <div className="stat-box">
          <div className="stat-value">{totalTicks}</div>
          <div className="stat-label">Total Ticks</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{aggCount}</div>
          <div className="stat-label">Aggregations</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{components.filter((c) => c.status === 'healthy').length}/{components.length}</div>
          <div className="stat-label">Healthy</div>
        </div>
      </div>
      <div className="status-grid">
        {components.map((comp) => (
          <div key={comp.name} className={`status-card status-${comp.status}`}>
            <div className="status-indicator" />
            <div className="status-info">
              <div className="status-name">{comp.name}</div>
              <div className="status-desc">{comp.description}</div>
              <div className="status-aws">↔ {comp.awsEquivalent}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
