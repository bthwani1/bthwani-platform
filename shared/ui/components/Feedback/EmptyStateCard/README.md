# EmptyStateCard

## Purpose

On first/empty views: explain what-to-do-now + 1 primary CTA.

## API

```typescript
interface EmptyStateCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

## Rules

- **Always include one primary CTA** - Guide user to next action
- **Clear explanation** - Explain what's missing and why
- **Single focus** - One primary action, optional secondary

## Usage Example

```tsx
import { EmptyStateCard } from '@/shared/ui/components/Feedback/EmptyStateCard';

<EmptyStateCard
  title="No orders yet"
  description="Start by creating your first order to get started."
  primaryAction={{
    label: "Create Order",
    onClick: () => navigate('/orders/new')
  }}
/>
```

## Best Practices

- ✅ Clear, actionable title
- ✅ Helpful description explaining context
- ✅ One primary action that solves the empty state
- ❌ Don't show multiple competing actions
- ❌ Don't use vague titles like "Nothing here"

