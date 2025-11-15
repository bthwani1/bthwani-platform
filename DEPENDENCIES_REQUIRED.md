# Required Dependencies

## Missing Dependencies

The following dependencies are required for the new Configuration Module but are not yet in `package.json`:

### Required
```bash
npm install joi
```

### Dev Dependencies
```bash
npm install --save-dev @types/joi
```

## Why These Are Needed

- **joi**: Required for environment variable validation schema in `src/config/env.schema.ts`
- **@types/joi**: TypeScript type definitions for joi

## Installation Command

Run this single command to install both:

```bash
npm install joi && npm install --save-dev @types/joi
```

## After Installation

1. Run migration: `npm run migration:up`
2. Start the application: `npm run start:dev`
3. Verify config endpoints are accessible

