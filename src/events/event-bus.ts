export interface PlatformEvent<TPayload = unknown> {
  type: string;
  tenantId?: string;
  resourceId?: string;
  payload: TPayload;
  timestamp: string;
}

type Handler = (event: PlatformEvent) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Handler[]>();

  publish(event: PlatformEvent) {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      void handler(event);
    }
  }

  subscribe(type: string, handler: Handler) {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }
}

export const eventBus = new EventBus();
