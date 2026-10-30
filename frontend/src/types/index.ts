export type SoundClass = 'horn' | 'siren' | 'other' | 'unknown';

export type Direction =
  | 'front_left'
  | 'front'
  | 'front_right'
  | 'left'
  | 'right'
  | 'rear_left'
  | 'rear'
  | 'rear_right'
  | 'unknown';

export type EventSource = 'simulation' | 'audio_replay' | 'live_audio' | 'hardware';

export type AlertState = 'active' | 'cleared' | 'uncertain';

export interface AcousticEvent {
  event_id: string;
  timestamp: string;
  sound_class: SoundClass;
  confidence: number;
  direction: Direction;
  direction_confidence: number | null;
  source: EventSource;
  alert_state: AlertState;
}

export interface SystemStatus {
  status: string;
  backend_version: string;
  input_mode: EventSource;
  classifier_available: boolean;
  classifier_model: string;
  localization_available: boolean;
  localization_method: string;
  active_websocket_connections: number;
  total_events_processed: number;
  timestamp: string;
}

export interface EventCreateRequest {
  sound_class: SoundClass;
  confidence: number;
  direction?: Direction;
  direction_confidence?: number | null;
  source?: EventSource;
  alert_state?: AlertState;
}
