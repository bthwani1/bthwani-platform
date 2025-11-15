# WLT Build Fixes

## Status
- Current errors: ~155 TypeScript errors due to `exactOptionalPropertyTypes: true`
- Main issues:
  1. Cannot assign `undefined` directly to optional properties
  2. Required parameters cannot follow optional parameters
  3. Type mismatches in interfaces

## Fix Strategy

### 1. Optional Property Assignment
Instead of:
```typescript
entity.optional_field = value; // where value might be undefined
```

Use:
```typescript
if (value !== undefined) {
  entity.optional_field = value;
}
```

### 2. Parameter Ordering
Required parameters must come before optional ones:
```typescript
// ❌ Wrong
method(@Query('opt') opt?: string, @Param('req') req: string)

// ✅ Correct  
method(@Param('req') req: string, @Query('opt') opt?: string)
```

### 3. Interface Parameters
When passing optional parameters to methods, use spread with conditional:
```typescript
await service.method({
  required: value,
  ...(optional !== undefined && { optional }),
});
```

## Files Requiring Fixes

### High Priority
1. Controllers - Parameter ordering
2. Services - Optional property assignments
3. Audit Logger - userId assignments
4. Entity assignments - optional fields

### Medium Priority
5. Repository methods - optional parameters
6. DTO mappings - undefined handling

## Estimated Fix Time
~30-60 minutes for systematic fixes

