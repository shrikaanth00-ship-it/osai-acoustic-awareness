import React from 'react';
import type { AcousticEvent } from '../types';
import { AlertCircle, Bell, Volume2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ActiveAlertCardProps {
  event: AcousticEvent | null;
}

export const ActiveAlertCard: React.FC<ActiveAlertCardProps> = ({ event }) => {
  if (!event) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Volume2 size={36} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Acoustic Monitoring Active</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: 4 }}>
          Listening for external vehicle horns, sirens, and emergency acoustic events.
        </p>
      </div>
    );
  }

  const isHorn = event.sound_class === 'horn';
  const isSiren = event.sound_class === 'siren';
  const isUncertain = event.alert_state === 'uncertain' || event.sound_class === 'unknown';
  const isCleared = event.alert_state === 'cleared';

  let bannerClass = 'badge-sim';
  let cardBorderColor = 'var(--bg-card-border)';
  let glowColor = 'transparent';

  if (event.alert_state === 'active' && (isHorn || isSiren)) {
    bannerClass = 'badge-alert';
    cardBorderColor = 'var(--alert-red)';
    glowColor = '0 0 25px var(--alert-red-dim)';
  } else if (isUncertain) {
    bannerClass = 'badge-uncertain';
    cardBorderColor = 'var(--warn-amber)';
    glowColor = '0 0 20px var(--warn-amber-dim)';
  } else if (isCleared) {
    bannerClass = 'badge-cleared';
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        border: `1.5px solid ${cardBorderColor}`,
        boxShadow: glowColor,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Meta Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${bannerClass}`}>
            {isHorn ? (
              <>
                <Bell size={13} /> VEHICLE HORN DETECTED
              </>
            ) : isSiren ? (
              <>
                <ShieldAlert size={13} /> EMERGENCY SIREN
              </>
            ) : isUncertain ? (
              <>
                <AlertCircle size={13} /> UNCERTAIN CLASSIFICATION
              </>
            ) : (
              <>
                <CheckCircle2 size={13} /> NON-HORN AMBIENT
              </>
            )}
          </span>

          <span className="badge badge-sim">
            SOURCE: {event.source.toUpperCase()}
          </span>
        </div>

        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Big Direction Alert Text */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Acoustic Alert Target
        </div>
        <div
          style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: isHorn || isSiren ? '#ffffff' : 'var(--text-main)',
            textShadow: isHorn || isSiren ? '0 0 15px rgba(255, 255, 255, 0.4)' : 'none',
            marginTop: '2px',
          }}
        >
          {event.sound_class.toUpperCase()} — {event.direction.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {/* Metrics Row: Explicit confidence breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            CLASSIFIER SCORE
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {(event.confidence * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-subtle)', marginTop: 2 }}>
            Uncalibrated model score
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            DIRECTION STATUS
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
            {event.direction.replace('_', ' ')}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-subtle)', marginTop: 2 }}>
            {event.direction_confidence !== null
              ? `${(event.direction_confidence * 100).toFixed(0)}% sector match`
              : 'Unknown without array'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            ALERT LIFECYCLE
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase', color: event.alert_state === 'active' ? '#ff4d64' : 'var(--text-muted)' }}>
            {event.alert_state}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-subtle)', marginTop: 2 }}>
            Visual HUD alert only
          </div>
        </div>
      </div>
    </div>
  );
};
