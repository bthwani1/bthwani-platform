# Var.Picker

## Purpose

Show VAR_* key, scope, short helper; surface-specific override hint.

## API

```typescript
interface VarPickerProps {
  varKey: string; // e.g., "VAR_MAX_LOGIN_ATTEMPTS"
  value: string | number | boolean;
  scope?: string; // e.g., "global", "user", "partner"
  helperText?: string;
  overrideHint?: string;
  onChange?: (value: string | number | boolean) => void;
  editable?: boolean; // default: false
  className?: string;
}
```

## Rules

- Display runtime variable information clearly
- Show scope and any override hints
- Allow editing only when editable prop is true

## Usage Example

```tsx
import { VarPicker } from '@/shared/ui/components/Var/VarPicker';

<VarPicker
  varKey="VAR_MAX_LOGIN_ATTEMPTS"
  value={5}
  scope="global"
  helperText="Maximum login attempts before account lockout"
  overrideHint="Can be overridden per user in admin panel"
  editable={true}
  onChange={(newValue) => updateConfig('VAR_MAX_LOGIN_ATTEMPTS', newValue)}
/>
```

## Use Cases

- Configuration management in admin dashboards
- Runtime variable display in SSOT dashboard
- Settings pages showing current values

