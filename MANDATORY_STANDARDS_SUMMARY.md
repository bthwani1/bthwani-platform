# Mandatory Standards Summary

## ⚠️ إلزامي لجميع المشاريع المستقبلية

تم إضافة UX Helper Kit كمعيار إلزامي يجب تطبيقه على جميع الواجهات الجديدة.

## ما تم إضافته

### 1. قواعد Frontend (`.github/Cursor/rules/Frontend.rules.mdc`)

تمت إضافة قسم **10.4 UX Helper Kit (MANDATORY STANDARD)** يحتوي على:

- المكونات الإلزامية
- القواعد الإلزامية
- المراجع الإلزامية
- Checklist قبل PR
- CI/CD Gates

### 2. معيار موثق (`docs/STANDARDS/UX_HELPER_KIT_STANDARD.md`)

معيار كامل موثق يحتوي على:

- Golden Rule
- Required Components
- A11y Requirements
- i18n Requirements
- Microcopy Pattern
- Pre-PR Checklist
- CI/CD Gates
- Enforcement

### 3. Checklist عملي (`shared/ui/CHECKLIST.md`)

Checklist تفصيلي للاستخدام قبل كل PR:

- Pre-Development
- Component Usage
- A11y
- i18n
- Testing
- Documentation
- CI/CD
- Final Review

### 4. تحديث GOV-02 Guide

تم إضافة تحذير في `docs/GOV-02_HELPER_GUIDE.md` يشير إلى أن هذا معيار إلزامي.

### 5. Standards Directory

تم إنشاء `docs/STANDARDS/` مع README يوضح كيفية إضافة معايير جديدة.

## التطبيق

### للمطورين

1. **قبل البدء**: راجع `docs/STANDARDS/UX_HELPER_KIT_STANDARD.md`
2. **أثناء التطوير**: استخدم `shared/ui/CHECKLIST.md`
3. **قبل PR**: تأكد من اكتمال جميع النقاط في Checklist

### للمراجعين

1. **تحقق من Checklist**: تأكد من اكتمال جميع النقاط
2. **تحقق من CI/CD**: يجب أن تمر جميع Gates
3. **رفض PRs**: أي PR لا يلتزم بالمعيار يجب رفضه

### لـ CI/CD

يجب إضافة Gates التالية:

- `gates / a11y` - Pa11y/LHCI checks
- `gates / i18n` - التحقق من عدم وجود hard-coded strings
- `gates / helper-kit` - التحقق من استخدام المكونات الموحدة

## المراجع السريعة

- **المعيار الكامل**: `docs/STANDARDS/UX_HELPER_KIT_STANDARD.md`
- **Checklist**: `shared/ui/CHECKLIST.md`
- **القواعد**: `.github/Cursor/rules/Frontend.rules.mdc` (القسم 10.4)
- **دليل الحوكمة**: `docs/GOV-02_HELPER_GUIDE.md`
- **Playbooks**: `shared/ui/playbooks/`

## Enforcement

**هذا المعيار إلزامي.** أي PR لا يلتزم بهذا المعيار سيتم رفضه حتى يتم التصحيح.

---

**Status**: ✅ Active & Mandatory
**Last Updated**: 2025-02-15

