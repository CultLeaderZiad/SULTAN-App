import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addTransaction = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getTransactions = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    const all = await q.collect();
    const filtered = args.type ? all.filter((t) => t.type === args.type) : all;
    return filtered.sort((a, b) => b.date - a.date);
  },
});

export const deleteTransaction = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.transactionId);
  },
});

export const getMonthlySummary = query({
  args: {
    userId: v.id("users"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const startDate = new Date(args.year, args.month - 1, 1).getTime();
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59).getTime();

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const monthTxns = txns.filter(
      (t) => t.date >= startDate && t.date <= endDate
    );

    const totalIncome = monthTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amountEGP, 0);

    const totalExpenses = monthTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amountEGP, 0);

    const net = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, net, savingsRate, count: monthTxns.length };
  },
});

export const getCategoryBreakdown = query({
  args: {
    userId: v.id("users"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const startDate = new Date(args.year, args.month - 1, 1).getTime();
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59).getTime();

    const txns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const monthExpenses = txns.filter(
      (t) => t.type === "expense" && t.date >= startDate && t.date <= endDate
    );

    const breakdown: Record<string, number> = {};
    for (const t of monthExpenses) {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amountEGP;
    }

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
    }));
  },
});
