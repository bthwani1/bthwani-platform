# Banners (Info/Warning)

## Purpose

Lightweight contextual hints (privacy mode, sensitive state).

## API

```typescript
interface BannerProps {
  variant: 'info' | 'warning' | 'error' | 'success';
  children: ReactNode;
  dismissible?: boolean; // default: false
  onDismiss?: () => void;
  className?: string;
}
```

## Rules

- Use for non-blocking contextual information
- Dismissible for non-critical messages
- Clear visual distinction by variant
- Don't use for critical errors (use error modals instead)

## Usage Example

```tsx
import { Banner } from '@/shared/ui/components/Banners';

<Banner variant="info" dismissible onDismiss={() => setShowBanner(false)}>
  Privacy mode is enabled. Some features may be limited.
</Banner>

<Banner variant="warning">
  Sensitive operation in progress. Please do not close this page.
</Banner>
```

## Variants

- **info**: General information (blue)
- **warning**: Cautionary messages (amber)
- **error**: Error states (red) - use sparingly
- **success**: Success confirmations (green)

## Best Practices

- ✅ Use for contextual hints that don't block user flow
- ✅ Make dismissible for non-critical info
- ✅ Keep messages concise
- ❌ Don't use for critical errors (use modals)
- ❌ Don't stack multiple banners

