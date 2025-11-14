# Contract Tests Remediation Guide

This document outlines the remediation steps for contract test failures identified in WAVE-DSH/02.

## Issues Identified

1. **401 Unauthorized** — Missing authentication scaffolding in Prism mock responses
2. **RFC7807 Code Format Violations** — Error payloads do not conform to standard error model
3. **TRACE Method Compliance** — Missing `Allow` header metadata for TRACE requests

## Remediation Steps

### 1. Authentication Scaffolding

**Problem:** Prism mock server returns 401 for endpoints requiring authentication, even when test tokens are provided.

**Solution:** Ensure the application's JWT authentication guard properly validates tokens and returns RFC7807-compliant errors.

**Implementation Checklist:**
- [ ] Verify `JwtAuthGuard` in `src/core/guards/jwt-auth.guard.ts` returns RFC7807-compliant errors
- [ ] Ensure `JwtStrategy` validates token signatures correctly
- [ ] Test with valid/invalid tokens to ensure proper error responses

**Example RFC7807 Error Response:**
```json
{
  "type": "https://api.bthwani.com/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "code": "DSH-401-UNAUTHORIZED",
  "detail": "Invalid or missing authentication token",
  "traceId": "00000000000000000000000000000000"
}
```

### 2. RFC7807 Error Model Compliance

**Problem:** Error responses do not follow the RFC7807 standard error model defined in OpenAPI schema.

**Solution:** Ensure all error responses use the `Problem` schema from `components/schemas/Problem`.

**Implementation Checklist:**
- [ ] Verify `AllExceptionsFilter` in `src/core/filters/all-exceptions.filter.ts` formats errors as RFC7807
- [ ] Ensure all error responses include required fields: `type`, `title`, `status`, `code`, `traceId`
- [ ] Verify error `code` follows pattern: `^[A-Z]{3}-[0-9]{3}-[A-Z0-9\-]+$` (e.g., `DSH-401-UNAUTHORIZED`)
- [ ] Test error responses match OpenAPI schema examples

**Required Fields:**
- `type` (string, URI): Machine-readable problem type
- `title` (string): Human-readable summary
- `status` (integer): HTTP status code
- `code` (string): Service-specific error code matching pattern
- `traceId` (string): Correlation identifier

**Optional Fields:**
- `detail` (string): Additional context (no PII)
- `instance` (string, URI): Reference to support ticket
- `errors` (array): Field-level validation errors

### 3. TRACE Method Compliance

**Problem:** TRACE requests are missing `Allow` header metadata.

**Solution:** Add `Allow` header to TRACE method responses indicating allowed HTTP methods.

**Implementation Checklist:**
- [ ] Add interceptor or middleware to handle TRACE requests
- [ ] Include `Allow` header with comma-separated list of allowed methods (e.g., `GET, POST, PUT, DELETE`)
- [ ] Ensure TRACE responses comply with RFC7231

**Example Implementation:**
```typescript
@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    if (request.method === 'TRACE') {
      response.setHeader('Allow', 'GET, POST, PUT, DELETE, PATCH');
    }
    
    return next.handle();
  }
}
```

## Testing

After implementing the above fixes:

1. **Run Contract Tests:**
   ```bash
   npm run contracts
   ```

2. **Verify Results:**
   - Check `dist/dsh/SCHEMA_REPORT.har` for test results
   - Ensure zero unique failures related to authentication, RFC7807, or TRACE compliance

3. **Manual Verification:**
   - Test authentication with valid/invalid tokens
   - Verify error responses match RFC7807 schema
   - Test TRACE requests return `Allow` header

## Notes

- Prism mock server limitations: Prism cannot fully validate JWT signatures or generate realistic error responses. These fixes must be implemented in the actual application.
- Contract tests validate the OpenAPI schema compliance, not the mock server behavior.
- All fixes should be tested against the actual running application, not just the mock server.

