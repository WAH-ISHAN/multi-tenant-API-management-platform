import type { Response } from "express";
import type { ApiCredential, ManagedApi } from "../apim/models.js";
import type { GatewayRequest } from "../types.js";

export interface GatewayContext {
  req: GatewayRequest;
  res: Response;
  api?: ManagedApi;
  credential?: ApiCredential;
  applicationId?: string;
  subscriptionId?: string;
}

export interface GatewayPolicy {
  name: string;
  priority: number;
  execute(ctx: GatewayContext, next: () => Promise<void>): Promise<void>;
}

export function composePolicies(policies: GatewayPolicy[], terminal: (ctx: GatewayContext) => Promise<void>) {
  const ordered = [...policies].sort((a, b) => a.priority - b.priority);
  return async (ctx: GatewayContext) => {
    let index = -1;

    async function dispatch(position: number): Promise<void> {
      if (position <= index) throw new Error("Gateway policy called next() more than once");
      index = position;
      const policy = ordered[position];
      if (!policy) {
        await terminal(ctx);
        return;
      }
      await policy.execute(ctx, () => dispatch(position + 1));
    }

    await dispatch(0);
  };
}
