# API Management Roadmap

## Implemented in the current MVP

- API registry and lifecycle transitions.
- Developer catalog.
- Application and subscription model.
- Local API key issuing and validation.
- Gateway policy SDK with priority-ordered policies.
- Subscription, scope, and traffic-manager checks.
- Security and analytics events.

## Next build slice

1. PostgreSQL persistence for registry and developer entities.
2. OpenAPI 3.x import that creates resources, scopes, docs, and request validators.
3. Redis-backed distributed quota counters.
4. Gateway config cache updated through NATS events.
5. Reverse proxy terminal handler with timeouts, retries, backend pools, and circuit breakers.

## Later platform capabilities

- Publisher, Developer, and Admin portals.
- API products.
- Service catalog.
- GraphQL, WebSocket, SSE, and webhook APIs.
- Prometheus/Grafana analytics.
- External key-manager adapters for Keycloak, Okta, Auth0, and Entra.
- Vault/AWS/Azure secrets adapters.
- SIEM, SOAR, DLP, WAF, and device-trust integrations.
