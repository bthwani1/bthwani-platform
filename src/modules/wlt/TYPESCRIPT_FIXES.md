# TypeScript Fixes for exactOptionalPropertyTypes

Due to `exactOptionalPropertyTypes: true` in tsconfig.json, we need to handle undefined explicitly for optional properties.

Key fixes needed:
1. Assign undefined explicitly when needed
2. Check for undefined before assigning optional properties
3. Use conditional assignment or provide defaults
4. Fix parameter ordering (required params cannot follow optional)

