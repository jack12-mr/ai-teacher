# Membership Upgrade Feature - Design Document

**Date:** 2026-02-03
**Status:** Draft - Phase 1 Brainstorming
**Project:** AI Teacher Assistant (晨佑AI教学)

---

## 1. Goals

### Primary Goals
1. **Replace Mock Data**: Remove all simulated/placeholder content from the upgrade modal and payment pages
2. **Align Content with Product**: Update feature descriptions to accurately reflect the AI Teacher Assistant platform (not generic SkillMap content)
3. **Maintain i18n Consistency**: Ensure all content changes are properly translated for both CN (Chinese) and INTL (English) versions
4. **Preserve Existing Architecture**: Work within the current dual-region payment system (WeChat/Alipay for CN, Stripe/PayPal for INTL)

### Success Criteria
- Upgrade modal displays real, product-specific features and benefits
- All pricing information is accurate and production-ready
- Translation keys are complete and contextually appropriate for both regions
- No hardcoded mock data remains in the codebase
- Payment flow remains functional for both regions

---

## 2. Non-Goals

- Redesigning the payment infrastructure or adding new payment providers
- Implementing new subscription tiers beyond monthly/yearly
- Adding analytics or tracking for conversion metrics
- Modifying the database schema for subscriptions
- Creating new UI components or redesigning existing layouts
- Implementing A/B testing for pricing or features

---

## 3. Current State Analysis

### Existing Implementation

**Files Involved:**
- [components/upgrade-modal.tsx](components/upgrade-modal.tsx) - Main upgrade modal component
- [app/payment/page.tsx](app/payment/page.tsx) - CN region payment page
- [app/payment/intl/page.tsx](app/payment/intl/page.tsx) - INTL region payment page
- [lib/i18n/translations/zh-CN.ts](lib/i18n/translations/zh-CN.ts) - Chinese translations
- [lib/i18n/translations/en-US.ts](lib/i18n/translations/en-US.ts) - English translations

### Problems Identified

1. **Generic Content in Upgrade Modal** (upgrade-modal.tsx:49-56, 138-165)
   - Features listed are generic "SkillMap" features
   - Don't reflect actual AI Teacher Assistant capabilities
   - Mock statistics (94%, 3.2x, 89%) with no data source

2. **Hardcoded Pricing** (upgrade-modal.tsx:43-65)
   - Pricing plans hardcoded in component (¥29, ¥69, ¥199)
   - Doesn't match actual pricing in payment pages
   - No quarterly plan exists in payment system

3. **Test Pricing in Payment Pages**
   - CN: ¥0.01 for both monthly/yearly (payment/page.tsx:35-46)
   - INTL: $4.99 monthly, $49.99 yearly (payment/intl/page.tsx:31-47)
   - Comments indicate these are test prices

4. **Inconsistent Feature Lists**
   - Upgrade modal features don't match payment page features
   - CN payment page: Chinese-specific features (payment/page.tsx:49-56)
   - INTL payment page: Generic English features (payment/intl/page.tsx:49-56)

5. **Translation Mismatches**
   - Brand name inconsistency: "晨佑AI教学" (CN) vs "SkillMap" (INTL)
   - Feature descriptions don't align between languages
   - Some features are education-focused, others are generic skill-tracking

---

## 4. Proposed Solution

### 4.1 Content Strategy

**Unified Feature Set** (AI Teacher Assistant specific):
- AI-powered question generation for exams
- Smart paper composition with difficulty balancing
- Personalized teaching suggestions based on student performance
- Wrong answer tracking and targeted practice
- Learning progress analytics
- Multi-subject support (customizable)
- Export to multiple formats (PDF, Word, etc.)
- Priority customer support

**Pricing Structure** (Production-ready):
- **CN Region:**
  - Monthly: ¥29.9/month
  - Yearly: ¥299/year (save ¥59.8, ~17% discount)

- **INTL Region:**
  - Monthly: $4.99/month
  - Yearly: $49.99/year (save $9.89, ~17% discount)

**Social Proof** (Realistic):
- Replace mock statistics with qualitative testimonials
- Remove specific percentages without data backing
- Focus on use cases: "Saves 5+ hours per week on lesson prep"

### 4.2 Implementation Approach

**Phase A: Update Translation Files**
1. Update `lib/i18n/translations/zh-CN.ts` upgrade section
2. Update `lib/i18n/translations/en-US.ts` upgrade section
3. Add new translation keys for AI Teacher features
4. Ensure brand consistency: "晨佑AI教学" (CN) and "AI Teacher Assistant" (INTL)

**Phase B: Update Upgrade Modal**
1. Replace hardcoded pricing with region-aware pricing constants
2. Update feature lists to use new translation keys
3. Remove quarterly plan (doesn't exist in payment system)
4. Replace mock statistics with testimonials
5. Update social proof section

**Phase C: Update Payment Pages**
1. Update CN payment page pricing (¥0.01 → ¥29.9/¥299)
2. Update INTL payment page pricing (keep current or adjust)
3. Align feature lists with upgrade modal
4. Update testimonials to match product context

**Phase D: Verification**
1. Test CN region flow (WeChat/Alipay)
2. Test INTL region flow (Stripe/PayPal)
3. Verify all translations render correctly
4. Check responsive design on mobile

---

## 5. Open Questions

### Q1: Production Pricing Confirmation
**Question:** Should we use the pricing I proposed (¥29.9/¥299 for CN, $4.99/$49.99 for INTL), or do you have specific pricing in mind?

**Options:**
- **Option A:** Use proposed pricing (¥29.9/¥299, $4.99/$49.99)
- **Option B:** Different pricing structure (please specify)

**Impact:** Affects translation strings and payment integration testing

---

### Q2: Quarterly Plan
**Question:** The upgrade modal shows a quarterly plan (¥69/quarter), but the payment system only supports monthly/yearly. Should we:

**Options:**
- **Option A:** Remove quarterly plan entirely (recommended - simpler)
- **Option B:** Implement quarterly plan in payment system (requires backend changes)

**Impact:** If Option B, this becomes a larger scope requiring payment API modifications

---

### Q3: Feature Prioritization
**Question:** Which features are most important to highlight in the upgrade modal?

**Current AI Teacher Features:**
- AI question generation
- Smart paper composition
- Difficulty analysis
- Personalized teaching suggestions
- Wrong answer tracking
- Progress analytics
- Multi-subject support
- Export functionality

**Options:**
- **Option A:** Highlight top 5 features (AI generation, smart composition, analytics, wrong answer tracking, export)
- **Option B:** Show all 8 features
- **Option C:** Different prioritization (please specify)

**Impact:** Affects modal layout and translation content

---

### Q4: Social Proof Strategy
**Question:** How should we handle social proof without real user data?

**Options:**
- **Option A:** Use generic testimonials with fictional personas (e.g., "Sarah M., High School Teacher")
- **Option B:** Remove social proof section entirely until we have real data
- **Option C:** Use qualitative benefits instead ("Saves hours per week", "Used by educators worldwide")

**Impact:** Affects credibility and conversion messaging

---

## 6. Edge Cases & Considerations

### Edge Case 1: Region Detection Failure
**Scenario:** `NEXT_PUBLIC_DEPLOYMENT_REGION` is undefined or invalid
**Current Behavior:** Defaults to "CN" (upgrade-modal.tsx:26)
**Proposed Handling:** Keep current default, add logging for debugging

### Edge Case 2: iOS App Users
**Scenario:** Users accessing from iOS app (App Store restrictions on payments)
**Current Behavior:** Redirects to dashboard, hides payment buttons (payment/page.tsx:76-80)
**Proposed Handling:** Keep current behavior, ensure upgrade modal also respects this

### Edge Case 3: Already Premium Users
**Scenario:** User with active subscription views upgrade modal
**Current Behavior:** Modal shows regardless of subscription status
**Proposed Handling:** Consider adding check to show "Manage Subscription" instead (future enhancement, not in scope)

### Edge Case 4: Currency Mismatch
**Scenario:** User in CN region but browser/VPN shows INTL
**Current Behavior:** Region determined by env var, not user location
**Proposed Handling:** Keep current behavior (env var is source of truth)

### Edge Case 5: Translation Key Missing
**Scenario:** New translation key not found in one language
**Current Behavior:** May show key name or undefined
**Proposed Handling:** Ensure all keys exist in both zh-CN.ts and en-US.ts before deployment

---

## 7. Technical Constraints

1. **No Database Schema Changes:** Must work with existing subscription tables
2. **No Payment Provider Changes:** Must use existing WeChat/Alipay/Stripe/PayPal integrations
3. **No Breaking Changes:** Existing payment flows must continue to work
4. **Environment Variable Dependency:** Region switching via `NEXT_PUBLIC_DEPLOYMENT_REGION` must remain
5. **i18n Architecture:** Must follow existing translation pattern (useT() hook, translation files)

---

## 8. Dependencies

- Existing payment API routes (`/api/payment/create`, `/api/payment/intl/create`)
- CloudBase (CN) and Supabase (INTL) authentication systems
- Translation system (`lib/i18n/index.tsx`)
- Region configuration (`lib/config/region.ts`)

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Pricing change breaks payment flow | High | Test both CN and INTL payment flows thoroughly |
| Translation keys missing | Medium | Verify all keys exist in both language files before deployment |
| Feature descriptions don't match product | Medium | Review with product owner before finalizing |
| iOS users see payment UI | Low | Verify `isIOSApp` hook works correctly |
| Currency display issues | Low | Test with both CNY and USD formatting |

---

## 10. Next Steps

**After Design Approval:**
1. Create detailed implementation plan (Phase 2: Planning)
2. Set up test environment for payment flow testing
3. Begin TDD cycle (Phase 3: Implementation)
4. Coordinate with product owner on final pricing and feature list

---

## Appendix A: Current vs Proposed Content

### Upgrade Modal - Free Features
**Current (Generic):**
- Multi-dimensional skill assessment
- Smart role classification
- Competitiveness analysis report
- Skill heatmap
- Basic learning suggestions

**Proposed (AI Teacher Specific):**
- Basic question generation (limited)
- Manual paper composition
- Standard difficulty levels
- Basic teaching suggestions
- Limited history (30 days)

### Upgrade Modal - Premium Features
**Current (Generic):**
- AI personalized learning path
- Daily precise study plan
- Smart progress tracking
- Weakness targeting
- Learning efficiency analysis
- Unlimited skill assessments
- Real-time progress monitoring
- Goal achievement prediction
- Exclusive learning community
- Priority customer support
- Early access to new features

**Proposed (AI Teacher Specific):**
- Unlimited AI question generation
- Smart paper composition with auto-balancing
- Advanced difficulty analysis
- Personalized teaching suggestions
- Wrong answer tracking & targeted practice
- Unlimited history & analytics
- Multi-subject support
- Export to PDF/Word/Excel
- Priority customer support
- Early access to new features

---

**End of Design Document**
