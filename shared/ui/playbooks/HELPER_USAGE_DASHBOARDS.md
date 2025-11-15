# Dashboards Playbook (Admin, Ops, Finance, Support, Marketing, Fleet, Partner, BI, SSOT, Security)

## Overview

This playbook defines how to use helper components in web dashboards (Next.js).

## 1. Helper Text for policy/fee/privacy-affecting settings

### Pattern

```tsx
import { HelperText } from '@/shared/ui/components/Form/HelperText';
import { VarPicker } from '@/shared/ui/components/Var/VarPicker';

<div>
  <label htmlFor="max-login-attempts">Max Login Attempts</label>
  <VarPicker
    varKey="VAR_MAX_LOGIN_ATTEMPTS"
    value={5}
    scope="global"
    helperText="Maximum login attempts before account lockout"
    editable={true}
    onChange={handleChange}
  />
  <HelperText id="max-login-helper" variant="warning">
    Changing this affects all users. Review impact before saving.
  </HelperText>
</div>
```

### Rules

- Use HelperText for policy/fee/privacy-affecting settings
- Show impact clearly
- Link to SSoT documentation when available

## 2. Context Panel at right (hotkey ?)

### Pattern

```tsx
import { ContextPanel } from '@/shared/ui/components/Help/ContextPanel';
import { useState, useEffect } from 'react';

const [isPanelOpen, setIsPanelOpen] = useState(false);

// Global hotkey
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '?' && !isPanelOpen) {
      setIsPanelOpen(true);
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isPanelOpen]);

<>
  <button onClick={() => setIsPanelOpen(true)}>
    <span className="sr-only">Open help (press ?)</span>
    Help
  </button>
  <ContextPanel
    isOpen={isPanelOpen}
    onClose={() => setIsPanelOpen(false)}
    title="Configuration Guide"
    docsLink="https://docs.bthwani.com/admin/config"
  >
    <p>Detailed configuration guide...</p>
  </ContextPanel>
</>
```

### Rules

- Context Panel opens from right side
- Global hotkey `?` to open
- Include links to SSoT
- Focus trap when open

## 3. Warning Banners for sensitive modes

### Pattern

```tsx
import { Banner } from '@/shared/ui/components/Banners';

{isSensitiveMode && (
  <Banner variant="warning" dismissible onDismiss={handleDismiss}>
    Sensitive operation in progress. Please do not close this page.
  </Banner>
)}
```

### Rules

- Use for non-blocking contextual warnings
- Dismissible for non-critical messages
- Clear visual distinction

## 4. Column tooltips + Inline Docs links

### Pattern

```tsx
import { TooltipIcon } from '@/shared/ui/components/Form/TooltipIcon';
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';

<table>
  <thead>
    <tr>
      <th>
        Fee Rate
        <TooltipIcon
          content="Percentage applied to transaction amount"
          ariaLabel="Fee rate definition"
        />
      </th>
      <th>
        Policy
        <InlineLink href="https://docs.bthwani.com/policies/fees">
          View Policy
        </InlineLink>
      </th>
    </tr>
  </thead>
</table>
```

### Rules

- Tooltips for column definitions
- Inline links to SSoT documentation
- Keep tooltips short (secondary info only)

## 5. ConfirmDiffModal for sensitive actions

### Pattern

```tsx
import { ConfirmDiffModal } from '@/shared/ui/components/Confirm/ConfirmDiffModal';
import { useState } from 'react';

const [showConfirm, setShowConfirm] = useState(false);

const handleSave = () => {
  setShowConfirm(true);
};

<ConfirmDiffModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleActualSave}
  title="Update Configuration"
  diffBefore={`VAR_MAX_LOGIN_ATTEMPTS: 5`}
  diffAfter={`VAR_MAX_LOGIN_ATTEMPTS: 3`}
  impactSummary="This will reduce login attempts for all users. Accounts will lock after 3 failed attempts instead of 5."
/>
```

### Rules

- Use for sensitive actions (deletions, financial changes, etc.)
- Show clear before/after comparison
- Explain impact clearly
- Require explicit confirmation

## Best Practices

- ✅ Helper text for policy/fee/privacy settings
- ✅ Context Panel with hotkey `?`
- ✅ Warning banners for sensitive modes
- ✅ Column tooltips + docs links
- ✅ ConfirmDiffModal for sensitive actions
- ❌ Don't hide critical info in tooltips
- ❌ Don't skip confirmation for sensitive actions

