# UX Helper Kit - Implementation Checklist

استخدم هذا الـ checklist قبل إنشاء PR لأي واجهة جديدة.

## Pre-Development

- [ ] راجعت `docs/GOV-02_HELPER_GUIDE.md`
- [ ] راجعت Playbook المناسب:
  - [ ] `HELPER_USAGE_APPS.md` (للتطبيقات)
  - [ ] `HELPER_USAGE_DASHBOARDS.md` (لللوحات)
  - [ ] `HELPER_USAGE_WEB.md` (للويب)
- [ ] راجعت Examples المناسبة في `examples/`

## Component Usage

### HelperText (للحقول الحرجة)

- [ ] كل حقل حرج يحتوي على HelperText
- [ ] HelperText مرئي دائماً (ليس hidden)
- [ ] النص ≤80 حرف
- [ ] يتبع Pattern: [Impact] + [Condition] + [Example]
- [ ] مرتبط عبر `aria-describedby`
- [ ] من ملف i18n (لا hard-coded)

### TooltipIcon (للتعريفات الثانوية)

- [ ] لا معلومات حرجة في tooltips
- [ ] للتعريفات/الأمثلة الثانوية فقط
- [ ] Keyboard accessible
- [ ] ESC to close يعمل

### ContextPanel / BottomSheet

- [ ] Desktop: ContextPanel (hotkey `?`)
- [ ] Mobile: BottomSheet (swipe to close)
- [ ] Focus trap يعمل
- [ ] ESC to close يعمل
- [ ] روابط SSoT موجودة

### EmptyStateCard

- [ ] CTA واحد رئيسي موجود
- [ ] شرح واضح لما ينقص
- [ ] Icon مناسب

### ConfirmDiffModal

- [ ] للعمليات الحساسة (حذف، تغييرات مالية)
- [ ] before/after واضح
- [ ] Impact summary موجود
- [ ] Focus trap يعمل

### InlineLink

- [ ] روابط SSoT موجودة حيث مطلوب
- [ ] `rel="noopener noreferrer"` موجود
- [ ] Icon موجود

### Banners

- [ ] للتنبيهات السياقية فقط
- [ ] Variant مناسب (info/warning/error/success)
- [ ] Dismissible للرسائل غير الحرجة

## A11y

- [ ] جميع المدخلات مرتبطة بـ HelperText عبر `aria-describedby`
- [ ] `role` attributes موجودة
- [ ] `aria-label` للأزرار بدون نص
- [ ] Focus trap في modals/panels
- [ ] ESC to close يعمل
- [ ] Keyboard navigation يعمل (Tab, Enter, Arrow keys)
- [ ] Screen reader testing تم
- [ ] Color contrast يلبي WCAG AA (4.5:1)

## i18n

- [ ] لا hard-coded strings
- [ ] جميع النصوص من ملفات i18n (ar/en)
- [ ] RTL يعمل بشكل صحيح
- [ ] اختبار RTL تم

## Testing

- [ ] Unit tests للمكونات
- [ ] Integration tests للواجهات
- [ ] A11y tests (Pa11y)
- [ ] RTL testing
- [ ] Keyboard navigation testing
- [ ] Screen reader testing

## Documentation

- [ ] README محدث إذا لزم
- [ ] Examples محدثة
- [ ] Playbooks محدثة إذا لزم

## CI/CD

- [ ] `gates / a11y` يمر
- [ ] `gates / i18n` يمر
- [ ] `gates / helper-kit` يمر (إذا كان موجود)

## Final Review

- [ ] جميع النقاط أعلاه مكتملة
- [ ] Code review تم
- [ ] Design review تم (إذا لزم)
- [ ] A11y review تم

---

**ملاحظة**: هذا الـ checklist إلزامي. لا تقم بإنشاء PR حتى تكتمل جميع النقاط.

