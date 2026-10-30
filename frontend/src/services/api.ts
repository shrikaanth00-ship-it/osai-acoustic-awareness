import type { AcousticEvent, SystemStatus, EventCreateRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Healthcheck failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE_URL}/api/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
  return res.json();
}

export async function fetchEvents(limit: number = 50): Promise<AcousticEvent[]> {
  const res = await fetch(`${API_BASE_URL}/api/events?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
  return res.json();
}

export async function postEvent(data: EventCreateRequest): Promise<AcousticEvent> {
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create event: ${res.statusText}`);
  return res.json();
}

export async function triggerSimulationPreset(preset: string): Promise<AcousticEvent> {
  const res = await fetch(`${API_BASE_URL}/api/simulation/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset }),
  });
  if (!res.ok) throw new Error(`Failed to trigger simulation: ${res.statusText}`);
  return res.json();
}
