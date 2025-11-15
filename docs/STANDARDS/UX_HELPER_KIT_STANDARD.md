# UX Helper Kit - Mandatory Standard

## Status: ✅ MANDATORY

هذا المعيار **إلزامي** لجميع الواجهات الجديدة في منصة بثواني.

## Scope

يُطبق هذا المعيار على:

- ✅ جميع التطبيقات (APP-USER, APP-PARTNER, APP-CAPTAIN, APP-FIELD)
- ✅ جميع لوحات التحكم (Admin, Ops, Finance, Support, Marketing, Fleet, Partner, BI, SSOT, Security)
- ✅ جميع أسطح الويب (bthwani.com, app.bthwani.com, admin.bthwani.com, إلخ)
- ✅ أي مكونات واجهة جديدة

## Golden Rule

**Critical info in visible Helper, not tooltip/placeholder only.**

جميع المعلومات الحرجة يجب أن تكون مرئية دائماً في HelperText، وليس مخفية في tooltips أو placeholders.

## Required Components

### 1. HelperText (إلزامي للحقول الحرجة)

```tsx
import { HelperText } from '@/shared/ui/components';

<input
  id="delivery-fee"
  aria-describedby="delivery-fee-helper"
/>
<HelperText id="delivery-fee-helper" variant="info">
  3% fee when paying in-app. Example: intra-city.
</HelperText>
```

**Rules:**
- مرئي دائماً (ليس hidden)
- ≤80 حرف
- Pattern: [Impact] + [Condition] + [Example]
- ربط عبر `aria-describedby`

### 2. TooltipIcon (للتعريفات الثانوية فقط)

```tsx
import { TooltipIcon } from '@/shared/ui/components';

<TooltipIcon
  content="This is a supplementary definition"
  ariaLabel="Learn more about this term"
/>
```

**Rules:**
- للتعريفات الثانوية فقط
- لا معلومات حرجة
- Keyboard accessible

### 3. ContextPanel / BottomSheet (للمعلومات الممتدة)

```tsx
// Desktop
import { ContextPanel } from '@/shared/ui/components';

// Mobile
import { BottomSheet } from '@/shared/ui/components';
```

**Rules:**
- Desktop: ContextPanel (hotkey `?`)
- Mobile: BottomSheet (swipe to close)
- Focus trap + ESC to close

### 4. EmptyStateCard (للحالات الفارغة)

```tsx
import { EmptyStateCard } from '@/shared/ui/components';

<EmptyStateCard
  title="No orders yet"
  description="Start by creating your first order."
  primaryAction={{
    label: "Create Order",
    onClick: () => navigate('/orders/new')
  }}
/>
```

**Rules:**
- CTA واحد رئيسي دائماً
- شرح واضح لما ينقص

### 5. ConfirmDiffModal (للعمليات الحساسة)

```tsx
import { ConfirmDiffModal } from '@/shared/ui/components';

<ConfirmDiffModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Account"
  diffBefore="Status: Active"
  diffAfter="Status: Deleted"
  impactSummary="This will permanently delete the account."
/>
```

**Rules:**
- للعمليات الحساسة (حذف، تغييرات مالية، إلخ)
- عرض before/after واضح
- شرح Impact

## A11y Requirements

### Required Attributes

- `aria-describedby` - ربط المدخلات بنصوص المساعدة
- `role` - للأدوار المناسبة (note, dialog, alert)
- `aria-live` - للمحتوى الديناميكي
- `aria-label` - للأزرار بدون نص

### Keyboard Navigation

- **Tab** - التنقل بين العناصر
- **Enter/Space** - تفعيل الأزرار
- **ESC** - إغلاق overlays
- **Arrow keys** - للقوائم والخيارات

### Focus Management

- Focus trap في modals/panels
- Focus على العنصر الأول عند الفتح
- Return focus عند الإغلاق

## i18n Requirements

### No Hard-coded Strings

❌ **Bad:**
```tsx
<HelperText>Enter your phone number</HelperText>
```

✅ **Good:**
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('ui-help');
<HelperText>{t('helper.example.phone_verification')}</HelperText>
```

### RTL Support

- جميع المكونات تدعم RTL تلقائياً
- استخدام `dir="rtl"` عند الحاجة
- اختبار RTL في جميع الحالات

## Microcopy Pattern

### Format

**[Impact] + [Condition] + [Short Example]**

### Examples

✅ **Good:**
- "3% fee when paying in-app. Example: intra-city."
- "Required for verification. Must match ID document."
- "Verification code will be sent. Example: +967 7XX XXX XXX."

❌ **Bad:**
- "Enter fee" (too vague)
- "This field is important" (no actionable info)
- "Fill this out" (no condition or example)

## Pre-PR Checklist

قبل إنشاء PR لأي واجهة جديدة، تأكد من:

- [ ] جميع الحقول الحرجة تحتوي على HelperText
- [ ] لا معلومات حرجة في tooltips/placeholders
- [ ] A11y attributes موجودة (`aria-describedby`, `role`, إلخ)
- [ ] جميع النصوص من i18n (ar/en)
- [ ] Empty states تحتوي على CTA واحد رئيسي
- [ ] العمليات الحساسة تستخدم ConfirmDiffModal
- [ ] روابط SSoT موجودة حيث مطلوب
- [ ] RTL يعمل بشكل صحيح
- [ ] Focus trap وESC to close يعملان
- [ ] Keyboard navigation يعمل
- [ ] Screen reader testing تم

## CI/CD Gates

جميع PRs للواجهات يجب أن تمر:

- `gates / a11y` - Pa11y/LHCI checks
- `gates / i18n` - التحقق من عدم وجود hard-coded strings
- `gates / helper-kit` - التحقق من استخدام المكونات الموحدة

## References

- `docs/GOV-02_HELPER_GUIDE.md` - دليل الحوكمة الكامل
- `shared/ui/playbooks/` - Playbooks لكل سطح
- `shared/ui/components/` - جميع المكونات مع README
- `.github/Cursor/rules/Frontend.rules.mdc` - القواعد الكاملة

## Enforcement

**هذا المعيار إلزامي.** أي PR لا يلتزم بهذا المعيار سيتم رفضه حتى يتم التصحيح.

---

**Last Updated**: 2025-02-15
**Status**: ✅ Active & Mandatory

