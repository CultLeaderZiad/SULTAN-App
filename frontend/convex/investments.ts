import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addInvestment = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("investments", args);
  },
});

export const getInvestments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const updateInvestmentValue = mutation({
  args: {
    investmentId: v.id("investments"),
    currentValue: v.number(),
    returnRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { investmentId, ...updates } = args;
    await ctx.db.patch(investmentId, updates);
  },
});

export const deleteInvestment = mutation({
  args: { investmentId: v.id("investments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.investmentId);
  },
});
