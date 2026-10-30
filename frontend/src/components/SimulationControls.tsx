import React, { useState } from 'react';
import { Sliders, Bell, AlertOctagon, ShieldAlert, Volume2, HelpCircle } from 'lucide-react';

interface SimulationControlsProps {
  onTriggerPreset: (preset: string) => Promise<void>;
  isLoading?: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  onTriggerPreset,
  isLoading = false,
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleTrigger = async (preset: string) => {
    setActivePreset(preset);
    try {
      await onTriggerPreset(preset);
    } finally {
      setTimeout(() => setActivePreset(null), 400);
    }
  };

  const PRESETS = [
    {
      id: 'horn_front_left',
      title: 'Horn (Front-Left)',
      subtitle: 'Sector 315° • Conf: 92%',
      icon: <Bell size={16} color="#ff334b" />,
      color: '#ff334b',
    },
    {
      id: 'horn_rear',
      title: 'Horn (Rear)',
      subtitle: 'Sector 180° • Conf: 89%',
      icon: <Bell size={16} color="#ff334b" />,
      color: '#ff334b',
    },
    {
      id: 'siren_front_right',
      title: 'Emergency Siren',
      subtitle: 'Sector 45° • Conf: 95%',
      icon: <ShieldAlert size={16} color="#ff334b" />,
      color: '#ff334b',
    },
    {
      id: 'non_horn_sound',
      title: 'Non-Horn Ambient',
      subtitle: 'Engine/Traffic • Cleared',
      icon: <Volume2 size={16} color="#38bdf8" />,
      color: '#38bdf8',
    },
    {
      id: 'uncertain_classification',
      title: 'Uncertain Sound',
      subtitle: 'Low Conf: 48% • Amber',
      icon: <AlertOctagon size={16} color="#f59e0b" />,
      color: '#f59e0b',
    },
    {
      id: 'unknown_direction',
      title: 'Unknown Direction',
      subtitle: 'Mono / No Array Localization',
      icon: <HelpCircle size={16} color="#f59e0b" />,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Acoustic Simulation Controls</h3>
        </div>
        <span className="badge badge-sim">SOURCE: SIMULATION ONLY</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {PRESETS.map((p) => {
          const isTriggering = activePreset === p.id;
          return (
            <button
              key={p.id}
              disabled={isLoading}
              onClick={() => handleTrigger(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                background: isTriggering ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isTriggering ? p.color : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '8px',
                textAlign: 'left',
                transform: isTriggering ? 'scale(0.98)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isTriggering) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
              }}
              onMouseLeave={(e) => {
                if (!isTriggering) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', marginTop: 2 }}>
                  {p.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.68rem', color: 'var(--text-subtle)', textAlign: 'right' }}>
        Triggers synthetic acoustic event payloads conforming to the OSAI Data Contract.
      </div>
    </div>
  );
};
