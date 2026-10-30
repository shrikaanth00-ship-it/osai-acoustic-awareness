import React, { useState } from 'react';
import type { AcousticEvent } from '../types';
import { History, Search, VolumeX } from 'lucide-react';

interface EventHistoryProps {
  events: AcousticEvent[];
  onSelectEvent?: (event: AcousticEvent) => void;
}

export const EventHistory: React.FC<EventHistoryProps> = ({ events, onSelectEvent }) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEvents = events.filter((ev) => {
    const matchesFilter = filterClass === 'all' || ev.sound_class === filterClass;
    const matchesSearch =
      searchTerm.trim() === '' ||
      ev.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.sound_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.direction.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Acoustic Event History</h3>
          <span className="badge badge-sim" style={{ fontSize: '0.65rem' }}>
            {filteredEvents.length} RECORD{filteredEvents.length === 1 ? '' : 'S'}
          </span>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['all', 'horn', 'siren', 'other', 'unknown'] as const).map((cls) => (
            <button
              key={cls}
              onClick={() => setFilterClass(cls)}
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: '6px',
                background: filterClass === cls ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)',
                color: filterClass === cls ? '#000000' : 'var(--text-muted)',
                fontWeight: filterClass === cls ? 700 : 500,
              }}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-subtle)' }} />
        <input
          type="text"
          placeholder="Filter by event ID, direction, sound..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px 7px 32px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-hud)',
          }}
        />
      </div>

      {/* Events Table / List */}
      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-subtle)' }}>
          <VolumeX size={28} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
          <p style={{ fontSize: '0.85rem' }}>No acoustic events match the selected criteria.</p>
        </div>
      ) : (
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredEvents.map((ev) => {
            const isHorn = ev.sound_class === 'horn';
            const isSiren = ev.sound_class === 'siren';
            return (
              <div
                key={ev.event_id}
                onClick={() => onSelectEvent && onSelectEvent(ev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  cursor: onSelectEvent ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isHorn || isSiren ? 'var(--alert-red)' : 'var(--accent-cyan)',
                      boxShadow: isHorn || isSiren ? '0 0 6px var(--alert-red)' : 'none',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                      {ev.sound_class}
                      <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        ({ev.direction.replace('_', ' ')})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                      ID: {ev.event_id} • Score: {(ev.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-sim" style={{ fontSize: '0.62rem' }}>
                    {ev.source}
                  </span>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', marginTop: 2 }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
