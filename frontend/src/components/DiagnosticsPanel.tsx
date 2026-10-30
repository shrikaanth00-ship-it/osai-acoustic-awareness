import React from 'react';
import type { SystemStatus } from '../types';
import { Activity, Cpu, Radio, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface DiagnosticsPanelProps {
  status: SystemStatus | null;
  isBackendConnected: boolean;
  isUsingClientMock: boolean;
  onToggleMockMode: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  status,
  isBackendConnected,
  isUsingClientMock,
  onToggleMockMode,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>System Diagnostics & Adapters</h3>
        </div>

        <button
          onClick={onToggleMockMode}
          className="badge"
          style={{
            background: isUsingClientMock ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.1)',
            color: isUsingClientMock ? '#fbbf24' : '#38bdf8',
            border: isUsingClientMock ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
            cursor: 'pointer',
          }}
          title="Toggle between Live FastAPI WebSocket and isolated Client-Side Mock mode"
        >
          {isUsingClientMock ? 'MODE: CLIENT-SIDE MOCK (OFFLINE)' : 'MODE: LIVE FASTAPI BACKEND'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* Backend & WebSocket Stream Status */}
        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isBackendConnected ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} color="#ff334b" />}
            WEBSOCKET STREAM
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 4, color: isBackendConnected ? '#10b981' : '#ff4d64' }}>
            {isBackendConnected ? 'Connected (ws://localhost:8000)' : 'Disconnected (Fallback Active)'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            Active Subscribers: {status?.active_websocket_connections ?? 0}
          </div>
        </div>

        {/* Classifier Status */}
        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Cpu size={14} color="#38bdf8" />
            AI CLASSIFIER MODEL
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 4, color: 'var(--warn-amber)' }}>
            {status?.classifier_available ? 'Model Loaded' : 'Unconfigured Placeholder'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            Training in Google Colab (Safe fallback active)
          </div>
        </div>

        {/* Localization / Array Status */}
        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Radio size={14} color="#38bdf8" />
            LOCALIZATION (DoA)
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 4, color: 'var(--warn-amber)' }}>
            {status?.localization_available ? 'Synchronized Array Ready' : 'Multichannel Array Pending'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            Mono input cannot localize sound direction
          </div>
        </div>

        {/* Input Adapter Mode */}
        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <AlertTriangle size={14} color="#38bdf8" />
            INPUT DATA SOURCE
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 4, color: '#38bdf8', textTransform: 'capitalize' }}>
            {status?.input_mode ?? 'Simulation'} Mode
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            Total Events: {status?.total_events_processed ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
};
