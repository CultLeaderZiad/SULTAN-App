import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createGoal = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    targetAmount: v.number(),
    currency: v.string(),
    targetDate: v.optional(v.number()),
    category: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("savingsGoals", {
      ...args,
      currentAmount: 0,
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

export const addToGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");
    const newAmount = goal.currentAmount + args.amount;
    const isCompleted = newAmount >= goal.targetAmount;
    await ctx.db.patch(args.goalId, {
      currentAmount: newAmount,
      isCompleted,
    });
  },
});

export const getGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});

export const updateGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    title: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { goalId, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }
    await ctx.db.patch(goalId, filtered);
  },
});
