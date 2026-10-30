import type { AcousticEvent, SystemStatus } from '../types';

type MessageHandler = (data: {
  type: 'EVENT' | 'SNAPSHOT';
  event?: AcousticEvent;
  status?: SystemStatus;
  recent_events?: AcousticEvent[];
}) => void;

type StatusChangeHandler = (connected: boolean) => void;

export class WebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private messageListeners: Set<MessageHandler> = new Set();
  private statusListeners: Set<StatusChangeHandler> = new Set();
  private reconnectTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private isExplicitlyClosed: boolean = false;
  private reconnectAttempts: number = 0;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      const apiHost = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/events';
      this.url = apiHost;
    }
  }

  connect() {
    this.isExplicitlyClosed = false;
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus(true);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.messageListeners.forEach((listener) => listener(parsed));
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = () => {
        this.notifyStatus(false);
      };

      this.ws.onclose = () => {
        this.notifyStatus(false);
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }

  onMessage(callback: MessageHandler) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onStatusChange(callback: StatusChangeHandler) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const wsClient = new WebSocketClient();
