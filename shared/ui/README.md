# Shared UI Components

Unified, accessible, and bilingual contextual help components for BThwani Platform.

## Overview

This directory contains reusable UI components for providing contextual help across all surfaces (apps, dashboards, web).

## Components

### Form Components

- **HelperText** - Short, actionable guidance (≤80 chars). Always visible.
- **TooltipIcon** - Secondary hints/definitions. Never for critical info.

### Help Components

- **ContextPanel** - Rich, longer guidance. Opens side-panel on desktop.
- **BottomSheet** - Mobile-first extended help.

### Feedback Components

- **EmptyStateCard** - Guides next action with one primary CTA.

### Confirm Components

- **ConfirmDiffModal** - High-risk changes. Shows before/after + impact.

### Docs Components

- **InlineLink** - Inline link to SSoT/Docs pages with icon.

### Var Components

- **Var.Picker** - Shows VAR_* key, scope, helper. For admin dashboards.

### Banner Components

- **Banners** - Lightweight contextual hints (info/warning/error/success).

## Usage

```tsx
import { HelperText, ContextPanel, EmptyStateCard } from '@/shared/ui/components';

// Use in your components
<HelperText id="field-helper" variant="info">
  3% fee when paying in-app. Example: intra-city.
</HelperText>
```

## Playbooks

See playbooks for surface-specific usage:

- `playbooks/HELPER_USAGE_APPS.md` - Mobile apps (React Native)
- `playbooks/HELPER_USAGE_DASHBOARDS.md` - Web dashboards (Next.js)
- `playbooks/HELPER_USAGE_WEB.md` - Web apps & websites (Next.js)

## Documentation

- `docs/GOV-02_HELPER_GUIDE.md` - Complete governance guide
- Component-specific READMEs in each component directory

## i18n

Translation files are in `shared/i18n/`:

- `ar/ui-help.json` - Arabic translations
- `en/ui-help.json` - English translations

## A11y

All components follow WCAG 2.1 AA standards:

- Proper ARIA attributes
- Keyboard navigation
- Focus trap for modals/panels
- Screen reader support
- Color contrast compliance

## Examples

See examples in:

- `apps/app-user/examples/HELPER_DEMO.md`
- `dashboards/admin/examples/HELPER_DEMO.md`
- `web/examples/HELPER_DEMO.md`

