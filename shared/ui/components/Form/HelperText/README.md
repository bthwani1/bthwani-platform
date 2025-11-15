# HelperText

## Purpose

Short, actionable guidance (≤80 chars). Must be visible without interaction.

## API

```typescript
interface HelperTextProps {
  id: string; // Used for aria-describedby
  children: string | ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'error';
  className?: string;
}
```

## Rules

- **No critical info in placeholder/tooltip only** - Critical information must be in HelperText, not hidden in tooltips or placeholders.
- **Keep copy concise**: [impact] + [condition] + [short example]
- **Always visible** - Helper text should be visible by default, not require interaction.

## A11y

- Link inputs via `aria-describedby={helperTextId}`
- Component has `role="note"` and `aria-live="polite"`
- Visible by default for screen readers

## Usage Example

```tsx
import { HelperText } from '@/shared/ui/components/Form/HelperText';

<>
  <input
    id="delivery-fee"
    aria-describedby="delivery-fee-helper"
    type="number"
  />
  <HelperText id="delivery-fee-helper" variant="info">
    3% fee when paying in-app. Example: intra-city.
  </HelperText>
</>
```

## Microcopy Pattern

Format: **[Impact] + [Condition] + [Short Example]**

- ✅ Good: "3% fee when paying in-app. Example: intra-city."
- ✅ Good: "Required for verification. Must match ID document."
- ❌ Bad: "Enter fee" (too vague)
- ❌ Bad: "This field is important" (no actionable info)

