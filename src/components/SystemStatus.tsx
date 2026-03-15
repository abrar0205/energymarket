import { useEffect, useState } from 'react';
import type { SystemComponent } from '../types';
import { getSystemStatus } from '../services/api';

interface StatusResponse {
  tickCounts: Record<string, number>;
  totalTicks: number;
  aggCount: number;
  components: SystemComponent[];
}

export default function SystemStatus() {
  const [totalTicks, setTotalTicks] = useState(0);
  const [aggCount, setAggCount] = useState(0);
  const [components, setComponents] = useState<SystemComponent[]>([]);

  useEffect(() => {
    let active = true;

    async function poll() {
      while (active) {
        try {
          const data = (await getSystemStatus()) as StatusResponse;
          if (!active) break;
          setTotalTicks(data.totalTicks);
          setAggCount(data.aggCount);
          setComponents(data.components);
        } catch {
          // will retry
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => { active = false; };
  }, []);

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
