import type { RateLimitPolicyDefinition } from "../apim/models.js";

interface Counter {
  count: number;
  resetAt: number;
}

export class TrafficManager {
  private counters = new Map<string, Counter>();

  check(key: string, policy: RateLimitPolicyDefinition) {
    const now = Date.now();
    const counter = this.counters.get(key);
    if (!counter || counter.resetAt <= now) {
      this.counters.set(key, { count: 1, resetAt: now + policy.periodSeconds * 1000 });
      return { allowed: true, remaining: policy.quota - 1, resetAt: now + policy.periodSeconds * 1000 };
    }

    if (counter.count >= policy.quota) {
      return { allowed: false, remaining: 0, resetAt: counter.resetAt };
    }

    counter.count += 1;
    return { allowed: true, remaining: policy.quota - counter.count, resetAt: counter.resetAt };
  }
}

export const trafficManager = new TrafficManager();
