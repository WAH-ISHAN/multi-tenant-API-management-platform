# Multi-Tenant API Management Platform

A TypeScript/Node.js backend project that demonstrates how an API Manager works: API owners publish APIs, developers create applications, subscribe to APIs, generate API keys, and call those APIs through a policy-driven gateway.

This project also includes Zero Trust security concepts such as tenant isolation, JWT validation, device trust signals, RBAC/ABAC policy checks, audit events, and Keycloak-ready identity integration.

## What This Project Shows

This is not just a simple API gateway. It is the first version of a multi-tenant API management platform, inspired by products such as WSO2 API Manager.

Main capabilities:

- API registry and lifecycle management
- Publisher APIs for API owners
- Developer APIs for API consumers
- Application and subscription model
- API key generation and validation
- Gateway runtime policy chain
- Scope validation
- Rate-limit policy checks
- Tenant-aware request handling
- Security event logging
- Keycloak/OIDC integration hooks
- Docker Compose setup with Gateway, Postgres, Keycloak, and Nginx

## Architecture

```text
Developers / API Owners
        |
        |-----------------------------|
        |                             |
        v                             v
 Publisher API                 Developer API
 Create APIs                   Discover APIs
 Publish APIs                  Create Applications
 Manage Lifecycle              Subscribe to APIs
                               Generate API Keys
        |                             |
        |-------------|---------------|
                      v
              Control Plane
              API Registry
              Subscriptions
              Policies
              Credentials
                      |
        |-------------|---------------|
        |                             |
        v                             v
  Traffic Manager              Key Manager
  Rate Limits                  API Keys
  Quotas                       Future OAuth/OIDC
        |                             |
        |-------------|---------------|
                      v
              API Gateway Runtime
              API Resolution
              API Key Validation
              Subscription Check
              Scope Check
              Rate Limit Check
              Analytics Event
                      |
                      v
              Backend Services
```

## Tech Stack

- TypeScript
- Node.js
- Express
- Zod
- JOSE/JWT
- Pino logging
- Vitest
- Docker Compose
- PostgreSQL container
- Keycloak container
- Nginx container

## Project Structure

```text
src/
  admin/             Admin/security APIs
  apim/              API Manager models, schemas, and in-memory store
  control-plane/     Publisher and Developer APIs
  events/            Event bus abstraction
  gateway/           Runtime gateway and policy chain
  key-manager/       API key manager abstraction
  security/          Zero Trust security middleware
  secops/            Security event stream
  services/          Legacy demo service router
  traffic/           Traffic manager quota checks

docs/
  architecture.md
  apim-roadmap.md

tests/
  policy-engine.test.ts
  gateway-policy-chain.test.ts
```

## Requirements

Install these before running the project:

- Node.js 22 or newer
- npm
- Docker Desktop, optional for running Postgres/Keycloak/Nginx

Check your versions:

```bash
node --version
npm --version
```

## Setup

Clone the repository:

```bash
git clone https://github.com/WAH-ISHAN/multi-tenant-API-management-platform.git
cd multi-tenant-API-management-platform
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Start the development server:

```bash
npm run dev
```

The server runs at:

```text
http://localhost:8080
```

Health check:

```bash
curl http://localhost:8080/healthz
```

Expected response:

```json
{
  "status": "ok"
}
```

## API Management Demo

The project includes a seeded published API:

```text
API ID: payments-api
Gateway path: /gateway/payments/transactions
Required scope: payments.read
Tenant: tenant-a
```

### 1. View API Catalog

```bash
curl http://localhost:8080/api/v1/developer/catalog?tenantId=tenant-a
```

This shows published APIs that developers can subscribe to.

### 2. Create a Developer Application

```bash
curl -X POST http://localhost:8080/api/v1/developer/applications \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"tenant-a\",\"name\":\"Mobile App\",\"callbackUrls\":[]}"
```

Copy the returned `id`. That is your `applicationId`.

### 3. Subscribe the Application to the API

Replace `<app-id>` with the application ID from the previous step:

```bash
curl -X POST http://localhost:8080/api/v1/developer/subscriptions \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"tenant-a\",\"applicationId\":\"<app-id>\",\"apiId\":\"payments-api\",\"plan\":\"gold\"}"
```

This creates a subscription between the developer application and the managed API.

### 4. Generate an API Key

Replace `<app-id>` again:

```bash
curl -X POST http://localhost:8080/api/v1/developer/credentials/api-keys \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"tenant-a\",\"applicationId\":\"<app-id>\",\"scopes\":[\"payments.read\"]}"
```

Copy the returned `apiKey`.

### 5. Call the Managed API Through the Gateway

Replace `<api-key>` with the API key from the previous step:

```bash
curl http://localhost:8080/gateway/payments/transactions \
  -H "x-tenant-id: tenant-a" \
  -H "x-api-key: <api-key>"
```

That means the request passed these gateway checks:

1. API exists and is published
2. API key is valid
3. Application has an active subscription
4. API key has the required scope
5. Rate limit policy allows the request

## Publisher API Examples

API owners use Publisher APIs to create and manage APIs.

Create or update an API:

```bash
curl -X POST http://localhost:8080/api/v1/publisher/apis \
  -H "Content-Type: application/json" \
  -d "{
    \"id\":\"orders-api\",
    \"tenantId\":\"tenant-a\",
    \"name\":\"Orders API\",
    \"version\":\"1.0.0\",
    \"context\":\"/orders\",
    \"upstream\":\"http://orders-service:3000\",
    \"protocol\":\"REST\",
    \"status\":\"CREATED\",
    \"authentication\":[\"api-key\"],
    \"rateLimitPolicy\":\"silver\",
    \"scopes\":[\"orders.read\"],
    \"resources\":[
      {\"method\":\"GET\",\"path\":\"/list\",\"scopes\":[\"orders.read\"]}
    ]
  }"
```

Publish an API:

```bash
curl -X POST http://localhost:8080/api/v1/publisher/apis/orders-api/publish
```

List APIs:

```bash
curl http://localhost:8080/api/v1/publisher/apis?tenantId=tenant-a
```

## Main Endpoints

Publisher endpoints:

```text
POST   /api/v1/publisher/apis
GET    /api/v1/publisher/apis
GET    /api/v1/publisher/apis/:id
PUT    /api/v1/publisher/apis/:id
DELETE /api/v1/publisher/apis/:id

POST /api/v1/publisher/apis/:id/publish
POST /api/v1/publisher/apis/:id/deprecate
POST /api/v1/publisher/apis/:id/retire
```

Developer endpoints:

```text
GET  /api/v1/developer/catalog
POST /api/v1/developer/applications
GET  /api/v1/developer/applications
POST /api/v1/developer/subscriptions
GET  /api/v1/developer/subscriptions
POST /api/v1/developer/credentials/api-keys
GET  /api/v1/developer/policies/rate-limits
```

Runtime gateway endpoint:

```text
ANY /gateway/:context/*
```

Example:

```text
GET /gateway/payments/transactions
```

## Zero Trust Demo

The older Zero Trust gateway demo is still available.

Generate a JWT:

```bash
npm run token:tenant-a
```

Call a protected service:

```bash
curl http://localhost:8080/api/finance/reports \
  -H "Authorization: Bearer <token>" \
  -H "x-device-trust: trusted"
```

Tenant spoofing is blocked:

```bash
curl http://localhost:8080/api/finance/reports \
  -H "Authorization: Bearer <tenant-a-token>" \
  -H "x-tenant-id: tenant-b"
```

## Docker Compose

Start supporting services:

```bash
docker compose up
```

Services:

```text
Gateway:  http://localhost:8080
Nginx:    http://localhost:8088
Postgres: localhost:5432
Keycloak: http://localhost:18080
```

Keycloak dev admin:

```text
Username: admin
Password: admin
```

## Testing

Run tests:

```bash
npm test
```

Build TypeScript:

```bash
npm run build
```

Check dependency security audit:

```bash
npm audit
```

## Current Status

Implemented:

- In-memory API registry
- API lifecycle actions
- Developer application creation
- API subscriptions
- Local API key issuing
- API key validation
- Scope validation
- Subscription validation
- Traffic manager quota checks
- Policy-based gateway pipeline
- Security events
- Keycloak/OIDC configuration hooks

Not implemented yet:

- PostgreSQL persistence
- OpenAPI import
- Real reverse proxy to backend services
- Redis-backed distributed rate limits
- Publisher/Developer frontend portals
- Prometheus/Grafana analytics dashboard
- NATS/Kafka gateway config propagation
- API products
- GraphQL/WebSocket gateway support

## Roadmap

1. Save APIs, applications, subscriptions, credentials, and audit logs in PostgreSQL.
2. Add OpenAPI 3.x import to generate routes, scopes, documentation, and validators.
3. Add real backend proxying with timeouts, retries, load balancing, and circuit breakers.
4. Add Redis-backed distributed traffic manager.
5. Add event-driven gateway config updates using NATS or Kafka.
6. Build Publisher Portal, Developer Portal, and Admin Portal.
7. Add Prometheus/Grafana metrics and analytics dashboards.
8. Add service catalog and API products.
9. Add GraphQL, WebSocket, SSE, and webhook support.
10. Add external integrations for Keycloak, Vault, SIEM, DLP, and device trust.

## Portfolio Summary

This project can be described as:

```text
Built a multi-tenant API management platform with a centralized control plane, API gateway, key management, subscriptions, traffic policies, security events, and Zero Trust access controls.
```

Use this statement only after the implemented features match what you are presenting.
