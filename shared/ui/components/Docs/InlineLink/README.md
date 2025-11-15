# Docs.InlineLink

## Purpose

Inline link to SSoT/Docs pages with icon.

## API

```typescript
interface InlineLinkProps {
  href: string;
  children: ReactNode;
  openInNewTab?: boolean; // default: true
  className?: string;
}
```

## Rules

- Use for linking to SSoT documentation
- Always include external link icon
- Opens in new tab by default (with proper security attributes)

## Usage Example

```tsx
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';

<p>
  For more details, see{' '}
  <InlineLink href="https://docs.bthwani.com/policies/delivery-fees">
    Delivery Fee Policy
  </InlineLink>
  .
</p>
```

## Security

- Uses `rel="noopener noreferrer"` when opening in new tab
- Prevents security vulnerabilities from external links

