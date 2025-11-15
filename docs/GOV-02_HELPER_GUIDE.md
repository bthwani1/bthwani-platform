# GOV-02 — Helper/Tooltip/Context Help Guide

## ⚠️ MANDATORY STANDARD

**هذا المعيار إلزامي لجميع الواجهات الجديدة.**

راجع `docs/STANDARDS/UX_HELPER_KIT_STANDARD.md` للمعيار الكامل.

## Golden Rule

**Critical info in visible Helper, not tooltip/placeholder only.**

All critical information must be visible without requiring user interaction. Tooltips and placeholders are for supplementary information only.

## Microcopy Style

### Pattern

**[Impact] + [Condition] + [Short Example]**

### Examples

✅ **Good:**
- "3% fee when paying in-app. Example: intra-city."
- "Required for verification. Must match ID document."
- "Verification code will be sent. Example: +967 7XX XXX XXX."

❌ **Bad:**
- "Enter fee" (too vague, no impact)
- "This field is important" (no actionable info)
- "Fill this out" (no condition or example)

### Guidelines

- **Length**: ≤80 characters for HelperText
- **Tone**: Direct, action-first
- **Language**: Clear and concise
- **Examples**: Include concrete examples when helpful

## A11y Baseline

### Required Attributes

- **aria-describedby**: Link inputs to helper text
  ```tsx
  <input aria-describedby="field-helper field-error" />
  <HelperText id="field-helper">...</HelperText>
  ```

- **Focus trap**: For modals, panels, and bottom sheets
  - Tab cycles within component
  - Shift+Tab reverses direction
  - First element receives focus on open

- **ESC to close**: All overlays (modals, panels, tooltips)
  ```tsx
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
  ```

- **Keyboard navigation**: All interactive elements
  - Tab to focus
  - Enter/Space to activate
  - Arrow keys for lists/options

### Screen Reader Support

- Use `role="note"` for helper text
- Use `aria-live="polite"` for dynamic content
- Use `aria-labelledby` for titled components
- Use `aria-label` for icon-only buttons

## Component Usage Rules

### HelperText

- ✅ Always visible
- ✅ Critical information
- ✅ ≤80 characters
- ✅ Linked via `aria-describedby`

### TooltipIcon

- ✅ Secondary hints only
- ✅ Definitions/examples
- ❌ Never critical info
- ✅ Keyboard accessible

### ContextPanel / BottomSheet

- ✅ Extended explanations
- ✅ Policies, fees, privacy
- ✅ Links to SSoT
- ✅ Focus trap + ESC

### EmptyStateCard

- ✅ One primary CTA
- ✅ Clear explanation
- ✅ Guide next action

### ConfirmDiffModal

- ✅ Sensitive actions
- ✅ Before/after comparison
- ✅ Impact summary
- ✅ Explicit confirmation

## Metrics

Track the following metrics to measure effectiveness:

- **Form error rate** ↓ - Should decrease with better helpers
- **Completion time** ↓ - Users complete forms faster
- **Tooltip/panel open rate** - Measure engagement with extended help
- **A11y audit scores** - Pa11y/LHCI should pass
- **User satisfaction** - Survey feedback on helpfulness

## Testing Checklist

### A11y Testing

- [ ] All inputs have `aria-describedby` linking to helpers
- [ ] Focus trap works in modals/panels
- [ ] ESC closes all overlays
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] Screen reader announces helper text
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

### Functional Testing

- [ ] Helper text visible by default
- [ ] Errors appear on blur/submit
- [ ] Tooltips open/close correctly
- [ ] Context panels open/close correctly
- [ ] Bottom sheets swipe to close (mobile)
- [ ] Empty states show appropriate CTAs
- [ ] Confirm modals show correct diff

### Content Testing

- [ ] Helper text follows microcopy pattern
- [ ] No critical info in tooltips only
- [ ] Examples are concrete and helpful
- [ ] Links to SSoT are correct
- [ ] i18n strings are complete (ar/en)

## Implementation Checklist

- [ ] All components created with A11y support
- [ ] i18n files created (ar/en)
- [ ] Playbooks created for each surface
- [ ] Examples wired into one screen per surface
- [ ] A11y tests added (Pa11y/LHCI)
- [ ] Documentation complete
- [ ] Lint rules configured (eslint-plugin-jsx-a11y)

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- Component README files in `shared/ui/components/`

