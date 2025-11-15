# ContextPanel

## Purpose

Rich, longer guidance (policies, fees, privacy). Opens side-panel on desktop.

## API

```typescript
interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  docsLink?: string;
  className?: string;
}
```

## Rules

- Use for extended explanations that don't fit in HelperText
- Include links to SSoT documentation when available
- Desktop: side panel from right
- Mobile: Consider using BottomSheet instead

## A11y

- **Focus trap** when open - Tab cycles within panel
- **ESC to close** - Pressing Escape closes the panel
- **Proper labelledby** - Uses `aria-labelledby` for title
- **Keyboard navigation** - All interactive elements accessible via keyboard
- **Backdrop click** - Clicking backdrop closes panel

## Usage Example

```tsx
import { ContextPanel } from '@/shared/ui/components/Help/ContextPanel';
import { useState } from 'react';

const [isPanelOpen, setIsPanelOpen] = useState(false);

<>
  <button onClick={() => setIsPanelOpen(true)}>
    Learn more about fees
  </button>
  <ContextPanel
    isOpen={isPanelOpen}
    onClose={() => setIsPanelOpen(false)}
    title="Delivery Fee Policy"
    docsLink="https://docs.bthwani.com/policies/delivery-fees"
  >
    <p>Detailed explanation of delivery fee structure...</p>
  </ContextPanel>
</>
```

## Hotkey Support

Consider adding a global hotkey (e.g., `?`) to open context panel in dashboards:

```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '?' && !isPanelOpen) {
      setIsPanelOpen(true);
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isPanelOpen]);
```

