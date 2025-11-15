# Example wiring (App-User)

## Payment Form with HelperText and BottomSheet

### Implementation

```tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { HelperText } from '@/shared/ui/components/Form/HelperText';
import { BottomSheet } from '@/shared/ui/components/Help/BottomSheet';

export const PaymentForm = () => {
  const [deliveryFee, setDeliveryFee] = useState('');
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const validateFee = (value: string) => {
    const num = parseFloat(value);
    if (!value) {
      setError('');
    } else if (isNaN(num) || num <= 0) {
      setError('Fee must be greater than 0');
    } else {
      setError('');
    }
  };

  return (
    <View>
      <Text>Delivery Fee</Text>
      <TextInput
        id="delivery-fee"
        value={deliveryFee}
        onChangeText={(text) => {
          setDeliveryFee(text);
          validateFee(text);
        }}
        onBlur={() => validateFee(deliveryFee)}
        placeholder="e.g., 5000 YER"
        accessibilityLabel="Delivery fee input"
        accessibilityDescribedBy="delivery-fee-helper delivery-fee-error"
      />
      
      {/* Helper Text - Always visible */}
      <HelperText id="delivery-fee-helper" variant="info">
        3% fee when paying in-app.{' '}
        <TouchableOpacity onPress={() => setShowDetails(true)}>
          <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>
            Learn more
          </Text>
        </TouchableOpacity>
      </HelperText>
      
      {/* Error Text - Appears on validation */}
      {error && (
        <HelperText id="delivery-fee-error" variant="error">
          {error}
        </HelperText>
      )}

      {/* BottomSheet for extended explanation */}
      <BottomSheet
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Delivery Fee Policy"
        docsLink="https://docs.bthwani.com/policies/delivery-fees"
      >
        <Text>
          Delivery fees are calculated based on distance and payment method.
          In-app payments have a 3% convenience fee. Cash payments have no
          additional fee.
        </Text>
        <Text style={{ marginTop: 16 }}>
          Example: For a 5000 YER order within the city, the in-app payment
          fee would be 150 YER (3%).
        </Text>
      </BottomSheet>
    </View>
  );
};
```

## Empty State Example

```tsx
import { EmptyStateCard } from '@/shared/ui/components/Feedback/EmptyStateCard';

export const OrdersEmptyState = ({ onNavigate }) => (
  <EmptyStateCard
    title="No orders yet"
    description="Start by creating your first order to get started with BThwani delivery."
    primaryAction={{
      label: "Create Order",
      onClick: () => onNavigate('/orders/new')
    }}
  />
);
```

## Key Points

1. **HelperText under field** - Always visible, not hidden
2. **Placeholder for examples only** - "e.g., 5000 YER" not instructions
3. **BottomSheet for 'Learn more'** - Extended explanations
4. **Errors on blur/submit** - Validation feedback
5. **EmptyState with CTA** - Guides next action

