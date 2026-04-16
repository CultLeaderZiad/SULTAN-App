import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
    language: v.union(v.literal("ar"), v.literal("en")),
    currency: v.union(v.literal("EGP"), v.literal("SAR"), v.literal("AED")),
    incomeRange: v.string(),
    goals: v.array(v.string()),
    plan: v.union(
      v.literal("trial"),
      v.literal("basic"),
      v.literal("pro"),
      v.literal("sultan")
    ),
    trialEndsAt: v.optional(v.number()),
    role: v.union(v.literal("user"), v.literal("admin")),
    onboardingCompleted: v.boolean(),
    theme: v.optional(v.union(v.literal("dark"), v.literal("light"))),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    currency: v.union(v.literal("EGP"), v.literal("SAR"), v.literal("AED")),
    amountEGP: v.number(),
    category: v.string(),
    aiCategory: v.optional(v.string()),
    description: v.string(),
    note: v.optional(v.string()),
    isHalal: v.boolean(),
    isRecurring: v.boolean(),
    recurringInterval: v.optional(v.string()),
    sourceType: v.union(
      v.literal("salary"),
      v.literal("freelance"),
      v.literal("side_hustle"),
      v.literal("investment"),
      v.literal("gift"),
      v.literal("other")
    ),
    date: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  budgets: defineTable({
    userId: v.id("users"),
    category: v.string(),
    limitAmount: v.number(),
    currency: v.string(),
    period: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    spentAmount: v.number(),
    alertAt: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  goldTracking: defineTable({
    userId: v.id("users"),
    gramsOwned: v.number(),
    karat: v.union(v.literal(18), v.literal(21), v.literal(24)),
    purchasePrice: v.number(),
    purchaseCurrency: v.string(),
    purchaseDate: v.number(),
    currentValueEGP: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  goldPrices: defineTable({
    karat: v.number(),
    pricePerGramEGP: v.number(),
    pricePerGramUSD: v.number(),
    source: v.string(),
    fetchedAt: v.number(),
  }).index("by_karat", ["karat"]),

  investments: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("gold"),
      v.literal("real_estate"),
      v.literal("sukuk"),
      v.literal("halal_stocks"),
      v.literal("savings"),
      v.literal("other")
    ),
    name: v.string(),
    amountInvested: v.number(),
    currency: v.string(),
    currentValue: v.optional(v.number()),
    returnRate: v.optional(v.number()),
    isHalal: v.boolean(),
    startDate: v.number(),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  savingsGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    currency: v.string(),
    targetDate: v.optional(v.number()),
    category: v.string(),
    emoji: v.string(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  sideHustles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(),
    monthlyIncome: v.number(),
    currency: v.string(),
    hoursPerWeek: v.number(),
    platform: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    startDate: v.number(),
  }).index("by_user", ["userId"]),

  aiInsights: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("spending_advice"),
      v.literal("inflation_alert"),
      v.literal("gold_recommendation"),
      v.literal("savings_tip"),
      v.literal("side_hustle_idea"),
      v.literal("budget_warning")
    ),
    title: v.string(),
    titleAr: v.string(),
    body: v.string(),
    bodyAr: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  inflationData: defineTable({
    month: v.string(),
    year: v.number(),
    ratePercent: v.number(),
    source: v.string(),
    itemsAffected: v.array(
      v.object({
        name: v.string(),
        nameAr: v.string(),
        priceChange: v.number(),
        category: v.string(),
      })
    ),
    survivalTips: v.array(v.string()),
    survivalTipsAr: v.array(v.string()),
    fetchedAt: v.number(),
  }).index("by_year_month", ["year", "month"]),

  prayerSettings: defineTable({
    userId: v.id("users"),
    city: v.string(),
    country: v.string(),
    quietHoursEnabled: v.boolean(),
    madhab: v.union(
      v.literal("hanafi"),
      v.literal("shafi"),
      v.literal("maliki"),
      v.literal("hanbali")
    ),
    notificationsEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.string(),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    currency: v.string(),
    amount: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    paymentMethod: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  pricingPlans: defineTable({
    planId: v.string(),
    nameEn: v.string(),
    nameAr: v.string(),
    priceMonthlyEGP: v.number(),
    priceYearlyEGP: v.number(),
    priceMonthlyUSD: v.number(),
    features: v.array(v.string()),
    featuresAr: v.array(v.string()),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    sortOrder: v.number(),
  }),

  adminLogs: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_admin", ["adminId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    titleAr: v.string(),
    body: v.string(),
    bodyAr: v.string(),
    isRead: v.boolean(),
    data: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  halalGuide: defineTable({
    category: v.string(),
    nameEn: v.string(),
    nameAr: v.string(),
    isHalal: v.boolean(),
    reason: v.string(),
    reasonAr: v.string(),
    alternative: v.optional(v.string()),
    alternativeAr: v.optional(v.string()),
    scholarSource: v.optional(v.string()),
  }),

  chatMessages: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
