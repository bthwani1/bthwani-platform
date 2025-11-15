# TooltipIcon

## Purpose

Secondary hints/definitions; never for required info.

## API

```typescript
interface TooltipIconProps {
  content: string | ReactNode;
  icon?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  ariaLabel?: string;
}
```

## Rules

- **Never for critical information** - Critical details must be in HelperText, not tooltips
- **Only supplementary** - Use for definitions, examples, or non-essential hints
- **Keyboard accessible** - Must support keyboard navigation

## A11y

- **Focusable** with Tab key
- **ESC to close** - Pressing Escape closes the tooltip
- **Arrow keys cycle** - Navigate between tooltips with arrow keys
- **ARIA labels** - Proper `aria-label`, `aria-expanded`, `aria-haspopup`

## Usage Example

```tsx
import { TooltipIcon } from '@/shared/ui/components/Form/TooltipIcon';

<TooltipIcon
  content="This is a supplementary explanation that doesn't contain critical information."
  ariaLabel="Learn more about this field"
/>
```

## When NOT to Use

❌ Don't use for:
- Required field information
- Validation rules
- Critical warnings
- Error messages
- Payment terms

✅ Use for:
- Definitions of terms
- Examples of optional formats
- Historical context
- Non-critical tips

