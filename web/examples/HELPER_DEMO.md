# Example wiring (Web)

## Signup Form with Inline Helper and Live Validation

### Implementation

```tsx
import React, { useState } from 'react';
import { HelperText } from '@/shared/ui/components/Form/HelperText';
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';
import { ContextPanel } from '@/shared/ui/components/Help/ContextPanel';

export const SignupForm = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);

  const validatePhone = (value: string) => {
    if (!value) {
      setError('');
      return;
    }
    if (!value.match(/^\+967[0-9]{9}$/)) {
      setError('Phone must be in format +967 7XX XXX XXX');
    } else {
      setError('');
    }
  };

  return (
    <form>
      <div>
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            validatePhone(e.target.value);
          }}
          placeholder="e.g., +967 7XX XXX XXX"
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
      </div>

      <div>
        <label>
          <input type="checkbox" />
          I agree to the{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyPanel(true)}
            className="text-blue-600 underline"
          >
            Privacy Policy
          </button>
        </label>
        <ContextPanel
          isOpen={showPrivacyPanel}
          onClose={() => setShowPrivacyPanel(false)}
          title="Privacy Policy"
          docsLink="https://docs.bthwani.com/policies/privacy"
        >
          <p>Full privacy policy content...</p>
        </ContextPanel>
      </div>

      <button type="submit">Sign Up</button>
    </form>
  );
};
```

## Hero Section with Mini-FAQ

```tsx
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';

export const HeroSection = () => (
  <section className="hero">
    <h1>Welcome to BThwani</h1>
    <p>Your trusted delivery partner in Yemen</p>
    
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
        <li>
          How do I track my order?{' '}
          <InlineLink href="https://docs.bthwani.com/faq/tracking">
            Learn more
          </InlineLink>
        </li>
      </ul>
    </div>
  </section>
);
```

## Empty State Example

```tsx
import { EmptyStateCard } from '@/shared/ui/components/Feedback/EmptyStateCard';

export const OrdersEmptyState = ({ onNavigate }) => (
  <EmptyStateCard
    title="No orders yet"
    description="Start by placing your first order to get started with BThwani delivery."
    primaryAction={{
      label: "Place Order",
      onClick: () => onNavigate('/orders/new')
    }}
  />
);
```

## Key Points

1. **Inline Helper with live validation** - Real-time feedback
2. **Hero + mini-FAQ** - Quick access to docs
3. **Context Panel for policies** - Extended information
4. **EmptyState with CTA** - Clear next action
5. **Tooltips for icons only** - Secondary info

