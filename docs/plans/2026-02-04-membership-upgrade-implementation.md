# Membership Upgrade Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock data in upgrade modal with real AI Teacher Assistant features, remove quarterly plan, and eliminate social proof section while maintaining i18n consistency.

**Architecture:** Update translation files first (zh-CN.ts, en-US.ts), then modify upgrade-modal.tsx to use new translations and remove unnecessary sections. No backend changes needed.

**Tech Stack:** React, TypeScript, Next.js, i18n translation system

---

## Task 1: Update Chinese Translations (zh-CN.ts)

**Files:**
- Modify: `lib/i18n/translations/zh-CN.ts:638-683`

**Step 1: Write test for translation keys**

Create: `lib/i18n/translations/__tests__/zh-CN.test.ts`

```typescript
import { zhCN } from '../zh-CN'

describe('zh-CN translations - upgrade section', () => {
  it('should have all required upgrade translation keys', () => {
    expect(zhCN.upgrade).toBeDefined()
    expect(zhCN.upgrade.title).toBe('升级到晨佑AI教学 Premium')
    expect(zhCN.upgrade.freeFeatures).toHaveLength(5)
    expect(zhCN.upgrade.premiumFeatures).toHaveLength(10)
  })

  it('should not have quarterly plan references', () => {
    const upgradeStr = JSON.stringify(zhCN.upgrade)
    expect(upgradeStr).not.toContain('季度')
    expect(upgradeStr).not.toContain('quarter')
  })

  it('should not have social proof keys', () => {
    expect(zhCN.upgrade.socialProof).toBeUndefined()
    expect(zhCN.upgrade.statEfficiency).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/i18n/translations/__tests__/zh-CN.test.ts`
Expected: FAIL - social proof keys still exist

**Step 3: Update zh-CN.ts upgrade section**

Modify: `lib/i18n/translations/zh-CN.ts:638-683`

```typescript
upgrade: {
  title: "升级到晨佑AI教学 Premium",
  subtitle: "解锁AI驱动的个性化教学体验",
  freePlan: "免费版",
  premiumPlan: "Premium版",
  recommended: "推荐",
  mostPopular: "最受欢迎",
  upgradeNow: "立即升级Premium",
  guarantee: "7天无理由退款保证 | 安全支付 | 专属客服支持",
  limitedOffer: "限时优惠",
  offerEnds: "新用户限时优惠，活动即将结束！",
  startingPrice: "起步价",
  freeFeatures: [
    "基础AI出题（每日限量）",
    "手动组卷功能",
    "标准难度等级",
    "基础教学建议",
    "历史记录（保留30天）",
  ],
  premiumFeatures: [
    "无限次AI智能出题",
    "智能组卷自动平衡难度",
    "高级难度分析",
    "个性化教学建议",
    "错题追踪与针对性练习",
    "无限历史记录与分析",
    "多学科支持",
    "导出PDF/Word/Excel",
    "优先客服支持",
    "新功能抢先体验",
  ],
  aiPathGen: "AI智能出题",
  aiPathGenDesc: "基于教学大纲和难度要求，AI自动生成高质量试题",
  smartTracking: "智能组卷",
  smartTrackingDesc: "自动平衡题目难度，确保试卷质量和区分度",
  dailyPlan: "错题追踪",
  dailyPlanDesc: "记录学生错题，生成针对性练习，提升学习效果",
  aiCoach: "教学分析",
  aiCoachDesc: "分析学生答题数据，提供个性化教学改进建议",
  selectPlan: "选择订阅计划",
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/i18n/translations/__tests__/zh-CN.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/i18n/translations/zh-CN.ts lib/i18n/translations/__tests__/zh-CN.test.ts
git commit -m "feat: update Chinese translations for upgrade modal

- Replace generic SkillMap features with AI Teacher features
- Remove social proof translation keys
- Update feature descriptions to match product

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update English Translations (en-US.ts)

**Files:**
- Modify: `lib/i18n/translations/en-US.ts:638-683`

**Step 1: Write test for English translation keys**

Create: `lib/i18n/translations/__tests__/en-US.test.ts`

```typescript
import { enUS } from '../en-US'

describe('en-US translations - upgrade section', () => {
  it('should have all required upgrade translation keys', () => {
    expect(enUS.upgrade).toBeDefined()
    expect(enUS.upgrade.title).toBe('Upgrade to AI Teacher Assistant Premium')
    expect(enUS.upgrade.freeFeatures).toHaveLength(5)
    expect(enUS.upgrade.premiumFeatures).toHaveLength(10)
  })

  it('should not have quarterly plan references', () => {
    const upgradeStr = JSON.stringify(enUS.upgrade)
    expect(upgradeStr).not.toContain('Quarterly')
    expect(upgradeStr).not.toContain('quarter')
  })

  it('should not have social proof keys', () => {
    expect(enUS.upgrade.socialProof).toBeUndefined()
    expect(enUS.upgrade.statEfficiency).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/i18n/translations/__tests__/en-US.test.ts`
Expected: FAIL - social proof keys still exist

**Step 3: Update en-US.ts upgrade section**

Modify: `lib/i18n/translations/en-US.ts:638-683`

```typescript
upgrade: {
  title: "Upgrade to AI Teacher Assistant Premium",
  subtitle: "Unlock AI-powered personalized teaching experience",
  freePlan: "Free",
  premiumPlan: "Premium",
  recommended: "Recommended",
  mostPopular: "Most Popular",
  upgradeNow: "Upgrade to Premium",
  guarantee: "7-day money-back guarantee | Secure payment | Dedicated support",
  limitedOffer: "Limited Offer",
  offerEnds: "New user discount, offer ending soon!",
  startingPrice: "Starting at",
  freeFeatures: [
    "Basic AI question generation (daily limit)",
    "Manual paper composition",
    "Standard difficulty levels",
    "Basic teaching suggestions",
    "History (30 days retention)",
  ],
  premiumFeatures: [
    "Unlimited AI question generation",
    "Smart paper composition with auto-balancing",
    "Advanced difficulty analysis",
    "Personalized teaching suggestions",
    "Wrong answer tracking & targeted practice",
    "Unlimited history & analytics",
    "Multi-subject support",
    "Export to PDF/Word/Excel",
    "Priority customer support",
    "Early access to new features",
  ],
  aiPathGen: "AI Question Generation",
  aiPathGenDesc: "Generate high-quality questions based on syllabus and difficulty requirements",
  smartTracking: "Smart Paper Composition",
  smartTrackingDesc: "Automatically balance question difficulty to ensure paper quality",
  dailyPlan: "Wrong Answer Tracking",
  dailyPlanDesc: "Track student mistakes and generate targeted practice to improve learning",
  aiCoach: "Teaching Analytics",
  aiCoachDesc: "Analyze student performance data and provide personalized teaching improvement suggestions",
  selectPlan: "Select Subscription Plan",
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/i18n/translations/__tests__/en-US.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/i18n/translations/en-US.ts lib/i18n/translations/__tests__/en-US.test.ts
git commit -m "feat: update English translations for upgrade modal

- Replace generic SkillMap features with AI Teacher features
- Remove social proof translation keys
- Update feature descriptions to match product

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update Upgrade Modal Component

**Files:**
- Modify: `components/upgrade-modal.tsx:43-244`

**Step 1: Write test for upgrade modal**

Create: `components/__tests__/upgrade-modal.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { UpgradeModal } from '../upgrade-modal'

// Mock i18n
jest.mock('@/lib/i18n', () => ({
  useT: () => ({
    upgrade: {
      title: 'Upgrade to AI Teacher Assistant Premium',
      freeFeatures: ['Feature 1', 'Feature 2'],
      premiumFeatures: ['Premium 1', 'Premium 2'],
      selectPlan: 'Select Plan',
    },
    subscription: {
      monthly: 'Monthly',
      yearly: 'Yearly',
      perMonth: '/month',
      perYear: '/year',
    },
  }),
}))

describe('UpgradeModal', () => {
  it('should not render quarterly plan', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={() => {}}
        onUpgradeSuccess={() => {}}
        currentRole="Free User"
      />
    )

    expect(screen.queryByText(/quarter/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/季度/)).not.toBeInTheDocument()
  })

  it('should not render social proof section', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={() => {}}
        onUpgradeSuccess={() => {}}
        currentRole="Free User"
      />
    )

    expect(screen.queryByText(/94%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/3.2x/)).not.toBeInTheDocument()
    expect(screen.queryByText(/12,000\+/)).not.toBeInTheDocument()
  })

  it('should render only monthly and yearly plans', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={() => {}}
        onUpgradeSuccess={() => {}}
        currentRole="Free User"
      />
    )

    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- components/__tests__/upgrade-modal.test.tsx`
Expected: FAIL - quarterly plan and social proof still rendered

**Step 3: Remove quarterly plan from pricingPlans array**

Modify: `components/upgrade-modal.tsx:43-65`

```typescript
const pricingPlans = [
  {
    name: t.subscription.monthly,
    price: "¥29",
    period: t.subscription.perMonth,
    popular: false,
    savings: "",
  },
  {
    name: t.subscription.yearly,
    price: "¥299",
    period: t.subscription.perYear,
    popular: true,
    savings: t.subscription.savePercent.replace("{percent}", "17"),
  },
]
```

**Step 4: Remove social proof Card section**

Modify: `components/upgrade-modal.tsx:198-217`

Delete the entire social proof Card:

```typescript
// DELETE LINES 198-217 (Social Proof Card)
```

**Step 5: Run test to verify it passes**

Run: `npm test -- components/__tests__/upgrade-modal.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add components/upgrade-modal.tsx components/__tests__/upgrade-modal.test.tsx
git commit -m "feat: remove quarterly plan and social proof from upgrade modal

- Remove quarterly plan (not supported in payment system)
- Remove social proof section with mock statistics
- Keep only monthly and yearly plans

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Verification - Test CN Region Flow

**Files:**
- Test: Manual testing in browser

**Step 1: Start development server**

Run: `npm run dev`
Expected: Server starts on http://localhost:3000

**Step 2: Set CN region environment**

Verify: `.env.local` has `NEXT_PUBLIC_DEPLOYMENT_REGION=CN`

**Step 3: Test upgrade modal**

1. Navigate to dashboard
2. Click upgrade button
3. Verify:
   - Title shows "升级到晨佑AI教学 Premium"
   - Only 2 plans shown (月度会员, 年度会员)
   - No quarterly plan
   - No social proof section
   - Features are AI Teacher specific

**Step 4: Test payment page**

1. Click "立即升级Premium"
2. Verify redirects to `/payment`
3. Verify pricing matches (¥0.01 test pricing)
4. Verify WeChat/Alipay options shown

**Step 5: Document results**

Create: `docs/testing/upgrade-modal-cn-verification.md`

```markdown
# CN Region Verification Results

**Date:** 2026-02-04
**Tester:** Claude

## Upgrade Modal
- ✓ Title: "升级到晨佑AI教学 Premium"
- ✓ Plans: Monthly and Yearly only
- ✓ No quarterly plan
- ✓ No social proof section
- ✓ Features: AI Teacher specific

## Payment Page
- ✓ Redirects to /payment
- ✓ Pricing: ¥0.01 (test mode)
- ✓ Payment methods: WeChat, Alipay
```

---

## Task 5: Verification - Test INTL Region Flow

**Files:**
- Test: Manual testing in browser

**Step 1: Set INTL region environment**

Modify: `.env.local` to `NEXT_PUBLIC_DEPLOYMENT_REGION=INTL`

**Step 2: Restart development server**

Run: `npm run dev`

**Step 3: Test upgrade modal**

1. Navigate to dashboard
2. Click upgrade button
3. Verify:
   - Title shows "Upgrade to AI Teacher Assistant Premium"
   - Only 2 plans shown (Monthly, Yearly)
   - No quarterly plan
   - No social proof section
   - Features are AI Teacher specific

**Step 4: Test payment page**

1. Click "Upgrade to Premium"
2. Verify redirects to `/payment/intl`
3. Verify pricing matches ($4.99/$49.99)
4. Verify Stripe/PayPal options shown

**Step 5: Document results**

Create: `docs/testing/upgrade-modal-intl-verification.md`

```markdown
# INTL Region Verification Results

**Date:** 2026-02-04
**Tester:** Claude

## Upgrade Modal
- ✓ Title: "Upgrade to AI Teacher Assistant Premium"
- ✓ Plans: Monthly and Yearly only
- ✓ No quarterly plan
- ✓ No social proof section
- ✓ Features: AI Teacher specific

## Payment Page
- ✓ Redirects to /payment/intl
- ✓ Pricing: $4.99/$49.99
- ✓ Payment methods: Stripe, PayPal
```

---

## Task 6: Final Commit and Cleanup

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Check for TypeScript errors**

Run: `npm run type-check` or `npx tsc --noEmit`
Expected: No errors

**Step 3: Final commit**

```bash
git add docs/testing/
git commit -m "docs: add verification results for upgrade modal changes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 4: Create summary document**

Create: `docs/plans/2026-02-04-membership-upgrade-summary.md`

```markdown
# Membership Upgrade Feature - Implementation Summary

**Completed:** 2026-02-04

## Changes Made

1. **Translation Updates**
   - Updated zh-CN.ts with AI Teacher specific features
   - Updated en-US.ts with AI Teacher specific features
   - Removed social proof translation keys
   - Removed quarterly plan references

2. **Component Updates**
   - Removed quarterly plan from upgrade-modal.tsx
   - Removed social proof section
   - Updated to use new translation keys

3. **Testing**
   - Added unit tests for translation files
   - Added component tests for upgrade modal
   - Verified CN region flow
   - Verified INTL region flow

## Files Modified
- lib/i18n/translations/zh-CN.ts
- lib/i18n/translations/en-US.ts
- components/upgrade-modal.tsx

## Files Created
- lib/i18n/translations/__tests__/zh-CN.test.ts
- lib/i18n/translations/__tests__/en-US.test.ts
- components/__tests__/upgrade-modal.test.tsx
- docs/testing/upgrade-modal-cn-verification.md
- docs/testing/upgrade-modal-intl-verification.md

## Verification Status
- ✓ CN region tested
- ✓ INTL region tested
- ✓ All unit tests passing
- ✓ No TypeScript errors
```

---

## Execution Notes

- **Test Framework:** Assumes Jest is configured (check package.json)
- **Test Location:** If `__tests__` folders don't exist, create them
- **Manual Testing:** Requires local dev server running
- **Environment Variables:** Requires `.env.local` file with `NEXT_PUBLIC_DEPLOYMENT_REGION`

---

**Plan complete and saved to `docs/plans/2026-02-04-membership-upgrade-implementation.md`.**
