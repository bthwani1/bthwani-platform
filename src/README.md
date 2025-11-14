# Source Code Structure

This directory contains the runtime implementation of the BThwani platform services.

## Directory Layout

```
src/
  core/            # Global pipes, filters, interceptors, guards, logger
  shared/          # Cross-cutting services, adapters, utils
  modules/
    dsh/           # DSH service implementation
      controllers/
      services/
      repositories/
      entities/
      dto/
      mappers/
```

## Core Module

The `core/` module provides cross-cutting concerns:

- **Filters**: `AllExceptionsFilter` - Maps exceptions to RFC7807 Problem responses
- **Middlewares**: `RequestIdMiddleware` - Adds request ID to all requests
- **Services**: `LoggerService` - Structured JSON logging

## Shared Module

The `shared/` module contains utilities and adapters used across services:

- Adapters (email, cache, storage)
- Mappers
- Common utilities

## Service Modules

Each service (e.g., `dsh/`) follows NestJS best practices:

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Encapsulate data access
- **Entities**: Domain models (MikroORM)
- **DTOs**: Input/output validation schemas
- **Mappers**: Convert between entities and DTOs

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test

# Build for production
npm run build
```

## Configuration

Environment variables are loaded from `.env` files. See `docs/Guidancefiles/ReposiGOV.mdc` for required variables.
