# ConfirmDiffModal

## Purpose

High-risk changes. Show before/after snippet + summary of impact.

## API

```typescript
interface ConfirmDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  diffBefore: string;
  diffAfter: string;
  impactSummary: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}
```

## Rules

- Use for sensitive actions (deletions, financial changes, status changes)
- Show clear before/after comparison
- Explain impact clearly
- Require explicit confirmation

## A11y

- **Focus trap** when open
- **ESC to close**
- **Proper labelledby** for title
- **Keyboard navigation** - Tab cycles through buttons

## Usage Example

```tsx
import { ConfirmDiffModal } from '@/shared/ui/components/Confirm/ConfirmDiffModal';

<ConfirmDiffModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Account"
  diffBefore="Account: user@example.com\nStatus: Active"
  diffAfter="Account: user@example.com\nStatus: Deleted"
  impactSummary="This will permanently delete the account and all associated data. This action cannot be undone."
/>
```

## When to Use

✅ Use for:
- Account deletions
- Financial transactions
- Status changes (active → deleted)
- Permission changes
- Configuration changes affecting multiple users

❌ Don't use for:
- Simple form submissions
- Non-destructive actions
- Low-risk operations

