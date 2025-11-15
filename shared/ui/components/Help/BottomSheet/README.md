# BottomSheet (Mobile)

## Purpose

Mobile-first extended help.

## API

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  docsLink?: string;
  className?: string;
}
```

## Rules

- Use on mobile devices for extended content
- Swipe down to close (drag handle visible)
- Full-width on mobile
- Max height 90vh to prevent overflow

## A11y

- **Focus trap** when open
- **ESC to close**
- **Proper labelledby** for title
- **Keyboard navigation** supported

## Usage Example

```tsx
import { BottomSheet } from '@/shared/ui/components/Help/BottomSheet';
import { useState } from 'react';

const [isSheetOpen, setIsSheetOpen] = useState(false);

<>
  <button onClick={() => setIsSheetOpen(true)}>
    Learn more
  </button>
  <BottomSheet
    isOpen={isSheetOpen}
    onClose={() => setIsSheetOpen(false)}
    title="Delivery Fee Details"
    docsLink="https://docs.bthwani.com/policies/delivery-fees"
  >
    <p>Detailed mobile-friendly explanation...</p>
  </BottomSheet>
</>
```

## Mobile Considerations

- **Swipe gesture** - Users can swipe down to close
- **Touch targets** - All buttons are at least 44x44px
- **Scrollable content** - Content area scrolls if exceeds max height
- **Backdrop tap** - Tapping backdrop closes sheet

