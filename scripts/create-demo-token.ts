import { SignJWT } from "jose";
import { config } from "../src/config.js";

const [tenantId = "tenant-a", role = "manager", deviceTrust = "trusted"] = process.argv.slice(2);
const secret = new TextEncoder().encode(config.JWT_DEMO_SECRET);

const token = await new SignJWT({
  tenant_id: tenantId,
  roles: [role],
  department: role.includes("finance") ? "finance" : "operations",
  auth_level: "passkey",
  device_trust: deviceTrust
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(`demo-${role}@${tenantId}`)
  .setIssuer(config.JWT_ISSUER)
  .setAudience(config.JWT_AUDIENCE)
  .setIssuedAt()
  .setExpirationTime("30m")
  .sign(secret);

console.log(token);
