# Web & Web-App Playbook

## Overview

This playbook defines how to use helper components in web applications and websites (Next.js).

## 1. Hero + mini-FAQ with Docs links

### Pattern

```tsx
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';

<section className="hero">
  <h1>Welcome to BThwani</h1>
  <p>Your trusted delivery partner</p>
  
  <div className="faq-mini">
    <h2>Frequently Asked Questions</h2>
    <ul>
      <li>
        How does delivery work?{' '}
        <InlineLink href="https://docs.bthwani.com/faq/delivery">
          Learn more
        </InlineLink>
      </li>
      <li>
        What are the fees?{' '}
        <InlineLink href="https://docs.bthwani.com/faq/fees">
          View pricing
        </InlineLink>
      </li>
    </ul>
  </div>
</section>
```

### Rules

- Hero section with clear value proposition
- Mini-FAQ with links to full documentation
- Links open in new tab with proper security

## 2. Inline Helper in signup/checkout; live validation

### Pattern

```tsx
import { HelperText } from '@/shared/ui/components/Form/HelperText';
import { useState } from 'react';

const [phone, setPhone] = useState('');
const [error, setError] = useState('');

const validatePhone = (value: string) => {
  if (!value.match(/^\+967[0-9]{9}$/)) {
    setError('Phone must be in format +967 7XX XXX XXX');
  } else {
    setError('');
  }
};

<>
  <input
    id="phone"
    type="tel"
    value={phone}
    onChange={(e) => {
      setPhone(e.target.value);
      validatePhone(e.target.value);
    }}
    aria-describedby="phone-helper phone-error"
  />
  <HelperText id="phone-helper" variant="info">
    Verification code will be sent. Example: +967 7XX XXX XXX.
  </HelperText>
  {error && (
    <HelperText id="phone-error" variant="error">
      {error}
    </HelperText>
  )}
</>
```

### Rules

- Helper text visible by default
- Live validation on input
- Errors appear immediately
- Clear examples in helper text

## 3. Tooltips for icons only; extended info in Modal/Side Panel

### Pattern

```tsx
import { TooltipIcon } from '@/shared/ui/components/Form/TooltipIcon';
import { ContextPanel } from '@/shared/ui/components/Help/ContextPanel';
import { useState } from 'react';

const [showDetails, setShowDetails] = useState(false);

<>
  <div>
    Privacy Policy
    <TooltipIcon
      content="Our privacy policy explains how we handle your data"
      ariaLabel="Privacy policy tooltip"
    />
    <button onClick={() => setShowDetails(true)}>
      Read full policy
    </button>
  </div>
  <ContextPanel
    isOpen={showDetails}
    onClose={() => setShowDetails(false)}
    title="Privacy Policy"
    docsLink="https://docs.bthwani.com/policies/privacy"
  >
    <p>Full privacy policy content...</p>
  </ContextPanel>
</>
```

### Rules

- Tooltips for icons/definitions only
- Extended info in Modal or Side Panel
- Never critical info in tooltips

## 4. EmptyState with single clear CTA

### Pattern

```tsx
import { EmptyStateCard } from '@/shared/ui/components/Feedback/EmptyStateCard';

{orders.length === 0 && (
  <EmptyStateCard
    title="No orders yet"
    description="Start by placing your first order to get started with BThwani."
    primaryAction={{
      label: "Place Order",
      onClick: () => navigate('/orders/new')
    }}
  />
)}
```

### Rules

- Always one primary CTA
- Clear explanation
- Guide to next action

## Best Practices

- ✅ Hero + mini-FAQ with docs links
- ✅ Inline helpers with live validation
- ✅ Tooltips for icons only
- ✅ Extended info in modals/panels
- ✅ Empty states with clear CTAs
- ❌ Don't hide critical info in tooltips
- ❌ Don't use placeholders for instructions
- ❌ Don't show multiple competing CTAs

