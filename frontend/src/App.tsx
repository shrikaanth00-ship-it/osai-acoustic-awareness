import React, { useState, useEffect, useCallback } from 'react';
import type { AcousticEvent, SystemStatus, Direction } from './types';
import { wsClient } from './services/websocket';
import { fetchSystemStatus, fetchEvents, triggerSimulationPreset } from './services/api';
import { clientMockService } from './services/mockService';
import { RadarHUD } from './components/RadarHUD';
import { ActiveAlertCard } from './components/ActiveAlertCard';
import { EventHistory } from './components/EventHistory';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SimulationControls } from './components/SimulationControls';
import { Radio, Shield, Eye } from 'lucide-react';

export const App: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<AcousticEvent | null>(null);
  const [events, setEvents] = useState<AcousticEvent[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [useClientMock, setUseClientMock] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize and connect WebSocket
  useEffect(() => {
    if (useClientMock) {
      wsClient.disconnect();
      setIsBackendConnected(false);
      setSystemStatus(clientMockService.getMockStatus());
      const mockEvts = clientMockService.getMockEvents();
      setEvents(mockEvts);
      if (mockEvts.length > 0) setCurrentEvent(mockEvts[0]);
      return;
    }

    // Try fetching status & initial events via REST first
    fetchSystemStatus()
      .then((status) => {
        setSystemStatus(status);
        setIsBackendConnected(true);
      })
      .catch(() => {
        // Fall back to mock if backend is down
        setIsBackendConnected(false);
        setSystemStatus(clientMockService.getMockStatus());
      });

    fetchEvents()
      .then((evts) => {
        setEvents(evts);
        if (evts.length > 0) setCurrentEvent(evts[0]);
      })
      .catch(() => {
        const mockEvts = clientMockService.getMockEvents();
        setEvents(mockEvts);
        if (mockEvts.length > 0) setCurrentEvent(mockEvts[0]);
      });

    // Connect WebSocket
    wsClient.connect();

    const unsubStatus = wsClient.onStatusChange((connected) => {
      setIsBackendConnected(connected);
      if (!connected && !useClientMock) {
        setSystemStatus(clientMockService.getMockStatus());
      }
    });

    const unsubMsg = wsClient.onMessage((msg) => {
      if (msg.type === 'SNAPSHOT') {
        if (msg.status) setSystemStatus(msg.status);
        if (msg.recent_events && msg.recent_events.length > 0) {
          setEvents(msg.recent_events);
          setCurrentEvent(msg.recent_events[msg.recent_events.length - 1]);
        }
      } else if (msg.type === 'EVENT' && msg.event) {
        const ev = msg.event;
        setCurrentEvent(ev);
        setEvents((prev) => [ev, ...prev.filter((item) => item.event_id !== ev.event_id)]);
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
      wsClient.disconnect();
    };
  }, [useClientMock]);

  // Handler for simulation trigger
  const handleTriggerPreset = useCallback(
    async (preset: string) => {
      setIsLoading(true);
      try {
        if (useClientMock || !isBackendConnected) {
          const simulatedEvent = clientMockService.generatePresetEvent(preset);
          setCurrentEvent(simulatedEvent);
          setEvents((prev) => [simulatedEvent, ...prev]);
        } else {
          const ev = await triggerSimulationPreset(preset);
          setCurrentEvent(ev);
          setEvents((prev) => [ev, ...prev.filter((item) => item.event_id !== ev.event_id)]);
        }
      } catch (err) {
        console.warn('Backend trigger failed, executing in offline fallback:', err);
        const fallbackEvent = clientMockService.generatePresetEvent(preset);
        setCurrentEvent(fallbackEvent);
        setEvents((prev) => [fallbackEvent, ...prev]);
      } finally {
        setIsLoading(false);
      }
    },
    [useClientMock, isBackendConnected]
  );

  // Manual interactive sector click on Radar
  const handleSelectRadarDirection = (dir: Direction) => {
    if (!currentEvent) {
      handleTriggerPreset(dir === 'unknown' ? 'unknown_direction' : 'horn_front_left');
    } else {
      const updated: AcousticEvent = {
        ...currentEvent,
        direction: dir,
        direction_confidence: dir === 'unknown' ? null : 0.88,
      };
      setCurrentEvent(updated);
    }
  };

  const toggleMockMode = () => {
    setUseClientMock((prev) => !prev);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Cockpit Header */}
      <header
        className="glass-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '2px solid rgba(0, 240, 255, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 0, 0, 0.6))',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--accent-cyan-glow)',
            }}
          >
            <Radio size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                OSAI
              </h1>
              <span className="badge badge-sim" style={{ fontSize: '0.62rem' }}>
                PROTOTYPE v0.1
              </span>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                <Eye size={12} /> VISUAL ALERTS ONLY
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Acoustic Awareness & Directional Visual HUD for Deaf and Hard-of-Hearing Drivers
            </p>
          </div>
        </div>

        {/* Live Stream Connectivity Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: isBackendConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.15)',
              border: isBackendConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isBackendConnected ? '#10b981' : '#f59e0b',
                boxShadow: isBackendConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              }}
            />
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {isBackendConnected ? 'FASTAPI WEBSOCKET STREAM LIVE' : 'CLIENT MOCK / SIMULATION FALLBACK'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Monitoring Grid */}
      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: 360-Degree Acoustic Radar */}
        <section className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--accent-cyan)" /> 360° Directional Acoustic Radar
            </h2>
            <span className="badge badge-sim">8-SECTOR HUD</span>
          </div>

          <RadarHUD
            currentDirection={currentEvent?.direction ?? 'unknown'}
            soundClass={currentEvent?.sound_class ?? 'unknown'}
            alertState={currentEvent?.alert_state ?? 'uncertain'}
            directionConfidence={currentEvent?.direction_confidence ?? null}
            onSelectDirection={handleSelectRadarDirection}
          />

          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-subtle)', textAlign: 'center', width: '100%' }}>
            Tip: Click any directional sector on the radar compass to preview directional positioning.
          </div>
        </section>

        {/* Right Column: Active Alert Card & Simulation Controls */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ActiveAlertCard event={currentEvent} />
          <SimulationControls onTriggerPreset={handleTriggerPreset} isLoading={isLoading} />
        </section>
      </main>

      {/* Bottom Section: Diagnostics & Event History */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
        <DiagnosticsPanel
          status={systemStatus}
          isBackendConnected={isBackendConnected}
          isUsingClientMock={useClientMock}
          onToggleMockMode={toggleMockMode}
        />
        <EventHistory
          events={events}
          onSelectEvent={(ev) => setCurrentEvent(ev)}
        />
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          padding: '16px 0',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-subtle)',
          fontFamily: 'var(--font-mono)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        OSAI Software-First Prototype • Truthful AI Acoustic Awareness • Model training in Colab • Multichannel hardware integration in progress
      </footer>
    </div>
  );
};

export default App;
