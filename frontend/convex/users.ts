import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    authId: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
    language: v.union(v.literal("ar"), v.literal("en")),
    currency: v.union(v.literal("EGP"), v.literal("SAR"), v.literal("AED")),
    incomeRange: v.string(),
    goals: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();
    if (existing) return existing._id;

    const userId = await ctx.db.insert("users", {
      ...args,
      plan: "trial",
      trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      role: "user",
      onboardingCompleted: false,
      theme: "dark",
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    });
    return userId;
  },
});

export const getByAuthId = query({
  args: { authId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.optional(v.union(v.literal("ar"), v.literal("en"))),
    currency: v.optional(
      v.union(v.literal("EGP"), v.literal("SAR"), v.literal("AED"))
    ),
    theme: v.optional(v.union(v.literal("dark"), v.literal("light"))),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }
    filtered.lastSeenAt = Date.now();
    await ctx.db.patch(userId, filtered);
  },
});

export const updateOnboarding = mutation({
  args: {
    userId: v.id("users"),
    language: v.union(v.literal("ar"), v.literal("en")),
    currency: v.union(v.literal("EGP"), v.literal("SAR"), v.literal("AED")),
    incomeRange: v.string(),
    goals: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...data } = args;
    await ctx.db.patch(userId, {
      ...data,
      onboardingCompleted: true,
      lastSeenAt: Date.now(),
    });
  },
});

export const setAdminRole = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: "admin" });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const updateUserPlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(
      v.literal("trial"),
      v.literal("basic"),
      v.literal("pro"),
      v.literal("sultan")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { plan: args.plan });
  },
});
