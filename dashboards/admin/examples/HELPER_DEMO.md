# Example wiring (Admin Dashboard)

## Configuration Form with VarPicker, HelperText, and ConfirmDiffModal

### Implementation

```tsx
import React, { useState } from 'react';
import { HelperText } from '@/shared/ui/components/Form/HelperText';
import { VarPicker } from '@/shared/ui/components/Var/VarPicker';
import { ConfirmDiffModal } from '@/shared/ui/components/Confirm/ConfirmDiffModal';
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';
import { ContextPanel } from '@/shared/ui/components/Help/ContextPanel';
import { useEffect } from 'react';

export const ConfigForm = () => {
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const previousValue = 5;

  // Global hotkey for context panel
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !isPanelOpen) {
        setIsPanelOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPanelOpen]);

  const handleSave = () => {
    if (maxLoginAttempts !== previousValue) {
      setShowConfirm(true);
    } else {
      // Save directly if no change
      handleActualSave();
    }
  };

  const handleActualSave = () => {
    // Save logic here
    console.log('Saving:', maxLoginAttempts);
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="max-login-attempts">Max Login Attempts</label>
        <VarPicker
          varKey="VAR_MAX_LOGIN_ATTEMPTS"
          value={maxLoginAttempts}
          scope="global"
          helperText="Maximum login attempts before account lockout"
          overrideHint="Can be overridden per user in admin panel"
          editable={true}
          onChange={(newValue) => setMaxLoginAttempts(Number(newValue))}
        />
        <HelperText id="max-login-helper" variant="warning">
          Changing this affects all users. Review impact before saving.{' '}
          <InlineLink href="https://docs.bthwani.com/admin/security/login-attempts">
            View policy
          </InlineLink>
        </HelperText>
      </div>

      <button onClick={handleSave}>Save Configuration</button>

      {/* Context Panel with hotkey ? */}
      <button onClick={() => setIsPanelOpen(true)}>
        Help (press ?)
      </button>
      <ContextPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="Configuration Guide"
        docsLink="https://docs.bthwani.com/admin/config"
      >
        <p>
          This configuration controls the maximum number of failed login
          attempts before an account is locked.
        </p>
        <p className="mt-4">
          <strong>Impact:</strong> Reducing this value will make accounts
          lock faster, improving security but potentially inconveniencing
          legitimate users.
        </p>
      </ContextPanel>

      {/* Confirm Diff Modal */}
      <ConfirmDiffModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleActualSave}
        title="Update Configuration"
        diffBefore={`VAR_MAX_LOGIN_ATTEMPTS: ${previousValue}`}
        diffAfter={`VAR_MAX_LOGIN_ATTEMPTS: ${maxLoginAttempts}`}
        impactSummary="This will reduce login attempts for all users. Accounts will lock after 3 failed attempts instead of 5. This may increase support requests."
      />
    </div>
  );
};
```

## Table with Tooltips and Docs Links

```tsx
import { TooltipIcon } from '@/shared/ui/components/Form/TooltipIcon';
import { InlineLink } from '@/shared/ui/components/Docs/InlineLink';

export const FeesTable = () => (
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
    <tbody>
      {/* Table rows */}
    </tbody>
  </table>
);
```

## Key Points

1. **Var.Picker + HelperText** - Show variable with helper
2. **Docs.InlineLink** - Link to SSoT documentation
3. **Context Panel** - Extended help with hotkey `?`
4. **ConfirmDiffModal** - Show before/after for sensitive changes
5. **Tooltips for columns** - Secondary info only

