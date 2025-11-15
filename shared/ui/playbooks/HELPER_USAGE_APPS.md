# Apps Playbook (APP-USER, PARTNER, CAPTAIN, FIELD)

## Overview

This playbook defines how to use helper components in mobile apps (React Native).

## 1. Inline Helper under field; errors on blur/submit

### Pattern

```tsx
import { HelperText } from '@/shared/ui/components/Form/HelperText';
import { useState } from 'react';

const [fee, setFee] = useState('');
const [error, setError] = useState('');

<>
  <TextInput
    id="delivery-fee"
    value={fee}
    onChangeText={setFee}
    onBlur={() => {
      if (!fee || parseFloat(fee) <= 0) {
        setError('Fee must be greater than 0');
      }
    }}
    aria-describedby="delivery-fee-helper delivery-fee-error"
  />
  <HelperText id="delivery-fee-helper" variant="info">
    3% fee when paying in-app. Example: intra-city.
  </HelperText>
  {error && (
    <HelperText id="delivery-fee-error" variant="error">
      {error}
    </HelperText>
  )}
</>
```

### Rules

- Helper text always visible below input
- Errors appear on blur or submit
- Use `aria-describedby` to link input with helper and error
- Keep helper text ≤80 characters

## 2. Placeholder only for examples

### Pattern

```tsx
<TextInput
  placeholder="e.g., 5000 YER"
  // Helper text contains the actual guidance
/>
<HelperText id="amount-helper">
  Enter amount in YER. Minimum: 1000 YER.
</HelperText>
```

### Rules

- Placeholders are for examples only, not instructions
- Critical information goes in HelperText
- Placeholders should be short (≤20 chars)

## 3. Use BottomSheet for 'Learn more'

### Pattern

```tsx
import { BottomSheet } from '@/shared/ui/components/Help/BottomSheet';
import { useState } from 'react';

const [showDetails, setShowDetails] = useState(false);

<>
  <HelperText id="fee-helper">
    3% fee when paying in-app.{' '}
    <TouchableOpacity onPress={() => setShowDetails(true)}>
      <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>
        Learn more
      </Text>
    </TouchableOpacity>
  </HelperText>
  <BottomSheet
    isOpen={showDetails}
    onClose={() => setShowDetails(false)}
    title="Delivery Fee Policy"
    docsLink="https://docs.bthwani.com/policies/delivery-fees"
  >
    <Text>Detailed explanation of delivery fee structure...</Text>
  </BottomSheet>
</>
```

### Rules

- Use BottomSheet for extended explanations
- Include link to SSoT documentation
- Swipe down to close
- Full-width on mobile

## 4. Coach marks (3–5) on first critical flows

### Pattern

```tsx
import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

const [showCoachMark, setShowCoachMark] = useState(false);
const [coachMarkIndex, setCoachMarkIndex] = useState(0);

const coachMarks = [
  { title: 'Welcome!', text: 'Start by creating your first order.' },
  { title: 'Payment', text: 'Select your preferred payment method.' },
  // ... 3-5 total
];

useEffect(() => {
  // Show on first visit
  if (isFirstVisit) {
    setShowCoachMark(true);
  }
}, []);

{showCoachMark && (
  <Modal transparent visible={showCoachMark}>
    <View style={styles.overlay}>
      <View style={styles.coachMark}>
        <Text style={styles.title}>{coachMarks[coachMarkIndex].title}</Text>
        <Text>{coachMarks[coachMarkIndex].text}</Text>
        <TouchableOpacity onPress={handleNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}
```

### Rules

- Show 3-5 coach marks maximum
- Only on first visit to critical flows
- Dismissible with "Skip" option
- Clear progression indicator

## 5. EmptyState guides next action

### Pattern

```tsx
import { EmptyStateCard } from '@/shared/ui/components/Feedback/EmptyStateCard';

{orders.length === 0 && (
  <EmptyStateCard
    title="No orders yet"
    description="Start by creating your first order to get started."
    primaryAction={{
      label: "Create Order",
      onClick: () => navigate('/orders/new')
    }}
  />
)}
```

### Rules

- Always include one primary CTA
- Clear explanation of what's missing
- Guide user to next action
- Use appropriate icon

## Best Practices

- ✅ Helper text visible by default
- ✅ Errors appear on blur/submit
- ✅ BottomSheet for extended help
- ✅ Coach marks for onboarding
- ✅ Empty states with clear CTAs
- ❌ Don't hide critical info in tooltips
- ❌ Don't use placeholders for instructions
- ❌ Don't show too many coach marks

