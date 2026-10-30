import type { AcousticEvent, SystemStatus } from '../types';

/**
 * Isolated client-side simulation engine used when backend is offline
 * or when the user explicitly enables offline simulation preview.
 * All events produced are explicitly tagged with source: 'simulation'.
 */
export class ClientMockSimulationService {
  private events: AcousticEvent[] = [];

  constructor() {
    this.events = [
      {
        event_id: 'evt_sim_init_1',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        sound_class: 'horn',
        confidence: 0.94,
        direction: 'front_left',
        direction_confidence: 0.88,
        source: 'simulation',
        alert_state: 'active',
      },
      {
        event_id: 'evt_sim_init_2',
        timestamp: new Date(Date.now() - 45000).toISOString(),
        sound_class: 'siren',
        confidence: 0.91,
        direction: 'rear_right',
        direction_confidence: 0.85,
        source: 'simulation',
        alert_state: 'cleared',
      },
    ];
  }

  getMockStatus(): SystemStatus {
    return {
      status: 'offline_fallback',
      backend_version: '0.1.0-mock-client',
      input_mode: 'simulation',
      classifier_available: false,
      classifier_model: 'Offline Client Mock (Backend Offline)',
      localization_available: false,
      localization_method: 'Synthetic 8-Sector Simulator',
      active_websocket_connections: 0,
      total_events_processed: this.events.length,
      timestamp: new Date().toISOString(),
    };
  }

  getMockEvents(): AcousticEvent[] {
    return [...this.events];
  }

  generatePresetEvent(preset: string): AcousticEvent {
    const id = `evt_mock_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    let event: AcousticEvent;
    switch (preset) {
      case 'horn_front_left':
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'horn',
          confidence: 0.93,
          direction: 'front_left',
          direction_confidence: 0.87,
          source: 'simulation',
          alert_state: 'active',
        };
        break;
      case 'horn_rear':
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'horn',
          confidence: 0.89,
          direction: 'rear',
          direction_confidence: 0.84,
          source: 'simulation',
          alert_state: 'active',
        };
        break;
      case 'siren_front_right':
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'siren',
          confidence: 0.96,
          direction: 'front_right',
          direction_confidence: 0.92,
          source: 'simulation',
          alert_state: 'active',
        };
        break;
      case 'non_horn_sound':
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'other',
          confidence: 0.72,
          direction: 'left',
          direction_confidence: 0.61,
          source: 'simulation',
          alert_state: 'cleared',
        };
        break;
      case 'uncertain_classification':
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'unknown',
          confidence: 0.49,
          direction: 'front',
          direction_confidence: 0.51,
          source: 'simulation',
          alert_state: 'uncertain',
        };
        break;
      case 'unknown_direction':
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'horn',
          confidence: 0.92,
          direction: 'unknown',
          direction_confidence: null,
          source: 'simulation',
          alert_state: 'active',
        };
        break;
      default:
        event = {
          event_id: id,
          timestamp: now,
          sound_class: 'horn',
          confidence: 0.88,
          direction: 'front',
          direction_confidence: 0.82,
          source: 'simulation',
          alert_state: 'active',
        };
        break;
    }

    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();
    return event;
  }
}

export const clientMockService = new ClientMockSimulationService();
