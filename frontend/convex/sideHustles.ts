import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addSideHustle = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sideHustles", args);
  },
});

export const getSideHustles = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sideHustles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteSideHustle = mutation({
  args: { hustleId: v.id("sideHustles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.hustleId);
  },
});
