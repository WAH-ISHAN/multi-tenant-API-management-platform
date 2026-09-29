import { logger } from "../logger.js";
import type { SecurityEvent } from "../types.js";

const events: SecurityEvent[] = [];
const maxEvents = 500;

export function emitSecurityEvent(event: SecurityEvent) {
  events.unshift(event);
  if (events.length > maxEvents) events.pop();
  logger.info({ event }, "security-event");
}

export function listSecurityEvents() {
  return events;
}
