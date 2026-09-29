import { describe, expect, it } from "vitest";
import { composePolicies, type GatewayPolicy } from "../src/gateway/policy-chain.js";

describe("gateway policy chain", () => {
  it("runs policies by priority and then terminal handler", async () => {
    const calls: string[] = [];
    const policies: GatewayPolicy[] = [
      { name: "second", priority: 20, execute: async (_ctx, next) => { calls.push("second"); await next(); } },
      { name: "first", priority: 10, execute: async (_ctx, next) => { calls.push("first"); await next(); } }
    ];

    const pipeline = composePolicies(policies, async () => {
      calls.push("terminal");
    });

    await pipeline({ req: {} as never, res: {} as never });

    expect(calls).toEqual(["first", "second", "terminal"]);
  });
});
