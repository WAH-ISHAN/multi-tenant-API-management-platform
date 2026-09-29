# Architecture

```text
Developers / API Owners
  |
  +--> Publisher API: API registry, lifecycle, docs, policies
  |
  +--> Developer API: catalog, applications, subscriptions, API keys
  |
  v
Control Plane
  |
  +--> Key Manager: API keys now, OAuth/OIDC adapters later
  +--> Traffic Manager: central quota decisions
  +--> Event Bus: API updated, policy pushed, analytics event
  |
  v
Gateway Runtime
  |
  +--> API resolution
  +--> API key authentication
  +--> Subscription validation
  +--> Scope validation
  +--> Rate limit decision
  +--> Analytics/security event
  |
  v
Managed Upstream APIs over TLS/mTLS
```

## Security control plane

- PKI/Internal CA: service certificates and mTLS identity.
- KMS/HSM: root and signing key protection.
- Secrets Manager: database passwords and third-party API credentials.
- PAM: short-lived privileged admin sessions.
- SIEM/SOAR: central events and defensive response workflows.
- EDR/XDR: endpoint and host risk signals.

## Request flow

1. API owner creates or imports an API in the Publisher API.
2. API is published into the control plane registry.
3. Developer discovers the API, creates an application, subscribes, and generates credentials.
4. Runtime request hits `/gateway/:context/*`.
5. Gateway resolves the API deployment from the registry/cache.
6. Gateway validates API key, subscription, scopes, and traffic policy.
7. Allowed requests route to the upstream handler/proxy.
8. Invocation events are emitted for analytics and SIEM/SOAR-style workflows.

## Management APIs

- `/api/v1/publisher/*` for API owners.
- `/api/v1/developer/*` for API consumers.
- `/gateway/*` for managed runtime traffic.
- `/api/*` keeps the original Zero Trust gateway demo endpoints.
