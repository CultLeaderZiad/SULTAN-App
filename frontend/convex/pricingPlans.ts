import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPlans = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("pricingPlans").collect();
    return plans
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const seedPricingPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("pricingPlans").first();
    if (existing) return;

    const plans = [
      {
        planId: "basic",
        nameEn: "Basic",
        nameAr: "أساسي",
        priceMonthlyEGP: 49,
        priceYearlyEGP: 490,
        priceMonthlyUSD: 1.5,
        features: [
          "Transaction tracking",
          "Basic budgets",
          "Gold price tracker",
          "5 AI chats/month",
        ],
        featuresAr: [
          "تتبع المعاملات",
          "ميزانيات أساسية",
          "تتبع سعر الذهب",
          "5 محادثات AI شهرياً",
        ],
        isActive: true,
        isFeatured: false,
        sortOrder: 1,
      },
      {
        planId: "pro",
        nameEn: "Pro",
        nameAr: "برو",
        priceMonthlyEGP: 99,
        priceYearlyEGP: 990,
        priceMonthlyUSD: 3,
        features: [
          "Everything in Basic",
          "50 AI chats/month",
          "Inflation survival guide",
          "Investment tracking",
          "Priority support",
        ],
        featuresAr: [
          "كل مميزات الأساسي",
          "50 محادثة AI شهرياً",
          "دليل البقاء من التضخم",
          "تتبع الاستثمارات",
          "دعم أولوية",
        ],
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      },
      {
        planId: "sultan",
        nameEn: "Sultan",
        nameAr: "سلطان",
        priceMonthlyEGP: 179,
        priceYearlyEGP: 1790,
        priceMonthlyUSD: 5.5,
        features: [
          "Everything in Pro",
          "Unlimited AI chats",
          "Family plan (3 users)",
          "Custom reports",
          "Zakat calculator",
          "Personal finance coach",
        ],
        featuresAr: [
          "كل مميزات البرو",
          "محادثات AI غير محدودة",
          "خطة عائلية (3 مستخدمين)",
          "تقارير مخصصة",
          "حاسبة الزكاة",
          "مدرب مالي شخصي",
        ],
        isActive: true,
        isFeatured: false,
        sortOrder: 3,
      },
    ];

    for (const p of plans) {
      await ctx.db.insert("pricingPlans", p);
    }
  },
});

export const updatePlan = mutation({
  args: {
    planDocId: v.id("pricingPlans"),
    priceMonthlyEGP: v.optional(v.number()),
    priceYearlyEGP: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { planDocId, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }
    await ctx.db.patch(planDocId, filtered);
  },
});
