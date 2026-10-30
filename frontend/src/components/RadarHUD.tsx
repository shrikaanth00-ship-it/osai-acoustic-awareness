import React from 'react';
import type { Direction, SoundClass, AlertState } from '../types';
import { Navigation, HelpCircle } from 'lucide-react';

interface RadarHUDProps {
  currentDirection: Direction;
  soundClass: SoundClass;
  alertState: AlertState;
  directionConfidence: number | null;
  onSelectDirection?: (dir: Direction) => void;
}

interface SectorConfig {
  key: Direction;
  label: string;
  angle: number; // In degrees, 0 = Front/North
  x: number;
  y: number;
}

const SECTORS: SectorConfig[] = [
  { key: 'front', label: 'FRONT', angle: 0, x: 150, y: 35 },
  { key: 'front_right', label: 'FR. RIGHT', angle: 45, x: 235, y: 65 },
  { key: 'right', label: 'RIGHT', angle: 90, x: 265, y: 150 },
  { key: 'rear_right', label: 'RR. RIGHT', angle: 135, x: 235, y: 235 },
  { key: 'rear', label: 'REAR', angle: 180, x: 150, y: 265 },
  { key: 'rear_left', label: 'RR. LEFT', angle: 225, x: 65, y: 235 },
  { key: 'left', label: 'LEFT', angle: 270, x: 35, y: 150 },
  { key: 'front_left', label: 'FR. LEFT', angle: 315, x: 65, y: 65 },
];

export const RadarHUD: React.FC<RadarHUDProps> = ({
  currentDirection,
  soundClass,
  alertState,
  directionConfidence,
  onSelectDirection,
}) => {
  const isHornOrSiren = soundClass === 'horn' || soundClass === 'siren';
  const isAlertActive = alertState === 'active' && isHornOrSiren;
  const isUncertain = alertState === 'uncertain' || soundClass === 'unknown';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 300, height: 300 }}>
        {/* SVG Radar Compass & Rings */}
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          style={{ overflow: 'visible' }}
          role="img"
          aria-label="360 degree acoustic direction radar"
        >
          <defs>
            <radialGradient id="radarGridGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </radialGradient>
            <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background Concentric Radar Rings */}
          <circle cx="150" cy="150" r="140" fill="url(#radarGridGrad)" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="150" cy="150" r="60" fill="none" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" />

          {/* Crosshairs */}
          <line x1="150" y1="10" x2="150" y2="290" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="1" />
          <line x1="10" y1="150" x2="290" y2="150" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="1" />
          <line x1="50" y1="50" x2="250" y2="250" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1" strokeDasharray="2 4" />
          <line x1="50" y1="250" x2="250" y2="50" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1" strokeDasharray="2 4" />

          {/* Rotating Radar Sweep Scanner */}
          <g style={{ transformOrigin: '150px 150px', animation: 'radar-sweep 5s linear infinite' }}>
            <line x1="150" y1="150" x2="150" y2="10" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
            <path
              d="M 150 150 L 150 10 A 140 140 0 0 1 248 52 Z"
              fill="url(#sweepGrad)"
            />
          </g>

          {/* Sector Highlight Arcs / Targets */}
          {SECTORS.map((sec) => {
            const isActive = currentDirection === sec.key;
            let fillColor = 'rgba(255, 255, 255, 0.03)';
            let strokeColor = 'rgba(255, 255, 255, 0.1)';

            if (isActive) {
              if (isAlertActive) {
                fillColor = 'rgba(255, 51, 75, 0.35)';
                strokeColor = '#ff334b';
              } else if (isUncertain) {
                fillColor = 'rgba(245, 158, 11, 0.35)';
                strokeColor = '#f59e0b';
              } else {
                fillColor = 'rgba(0, 240, 255, 0.3)';
                strokeColor = '#00f0ff';
              }
            }

            return (
              <g
                key={sec.key}
                onClick={() => onSelectDirection && onSelectDirection(sec.key)}
                style={{ cursor: onSelectDirection ? 'pointer' : 'default' }}
              >
                {/* Sector Target Wedge Circle */}
                <circle
                  cx={sec.x}
                  cy={sec.y}
                  r={isActive ? 20 : 14}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isActive ? 2.5 : 1}
                  className={isActive && isAlertActive ? 'radar-sector-active' : isActive && isUncertain ? 'radar-sector-amber' : ''}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {isActive && (
                  <circle
                    cx={sec.x}
                    cy={sec.y}
                    r={26}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    style={{ animation: 'radar-sweep 6s linear infinite', transformOrigin: `${sec.x}px ${sec.y}px` }}
                  />
                )}
              </g>
            );
          })}

          {/* Center Vehicle Icon */}
          <g transform="translate(135, 130)">
            <rect
              x="0"
              y="0"
              width="30"
              height="44"
              rx="8"
              fill="#161b22"
              stroke={isAlertActive ? '#ff334b' : '#00f0ff'}
              strokeWidth="2"
            />
            {/* Windshield */}
            <path d="M 5 12 L 25 12 L 22 22 L 8 22 Z" fill={isAlertActive ? 'rgba(255,51,75,0.4)' : 'rgba(0,240,255,0.3)'} />
            {/* Front Headlights */}
            <circle cx="5" cy="4" r="2" fill="#fff" opacity="0.9" />
            <circle cx="25" cy="4" r="2" fill="#fff" opacity="0.9" />
            {/* Rear Lights */}
            <circle cx="5" cy="40" r="2" fill="#ff334b" opacity="0.9" />
            <circle cx="25" cy="40" r="2" fill="#ff334b" opacity="0.9" />
          </g>
        </svg>

        {/* Floating Sector Text Labels */}
        {SECTORS.map((sec) => {
          const isActive = currentDirection === sec.key;
          return (
            <div
              key={sec.key}
              onClick={() => onSelectDirection && onSelectDirection(sec.key)}
              style={{
                position: 'absolute',
                left: `${sec.x}px`,
                top: `${sec.y}px`,
                transform: 'translate(-50%, -50%)',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-mono)',
                color: isActive
                  ? isAlertActive
                    ? '#ff4d64'
                    : isUncertain
                    ? '#fbbf24'
                    : '#00f0ff'
                  : 'var(--text-subtle)',
                pointerEvents: 'none',
                textShadow: isActive ? '0 0 8px currentColor' : 'none',
              }}
            >
              {sec.label}
            </div>
          );
        })}
      </div>

      {/* Direction Telemetry Badge */}
      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {currentDirection === 'unknown' ? (
            <span className="badge badge-uncertain">
              <HelpCircle size={13} /> DIRECTION: UNKNOWN (NO ARRAY)
            </span>
          ) : (
            <span
              className={`badge ${
                isAlertActive ? 'badge-alert' : isUncertain ? 'badge-uncertain' : 'badge-sim'
              }`}
            >
              <Navigation size={13} style={{ transform: 'rotate(45deg)' }} />
              SECTOR: {currentDirection.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>

        <div
          style={{
            marginTop: '6px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          {directionConfidence !== null && currentDirection !== 'unknown' ? (
            <>
              Direction Confidence:{' '}
              <strong style={{ color: 'var(--text-main)' }}>
                {(directionConfidence * 100).toFixed(0)}%
              </strong>{' '}
              (uncalibrated)
            </>
          ) : (
            <span style={{ color: 'var(--warn-amber)' }}>
              Direction unlocalized — multichannel array pending hardware integration
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
