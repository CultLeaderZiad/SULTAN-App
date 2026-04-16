import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addGoldHolding = mutation({
  args: {
    userId: v.id("users"),
    gramsOwned: v.number(),
    karat: v.union(v.literal(18), v.literal(21), v.literal(24)),
    purchasePrice: v.number(),
    purchaseCurrency: v.string(),
    purchaseDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("goldTracking", args);
  },
});

export const getGoldHoldings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goldTracking")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteGoldHolding = mutation({
  args: { holdingId: v.id("goldTracking") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.holdingId);
  },
});

export const updateGoldPrices = mutation({
  args: {
    prices: v.array(
      v.object({
        karat: v.number(),
        pricePerGramEGP: v.number(),
        pricePerGramUSD: v.number(),
        source: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const price of args.prices) {
      await ctx.db.insert("goldPrices", {
        ...price,
        fetchedAt: Date.now(),
      });
    }
  },
});

export const getLatestGoldPrices = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("goldPrices").collect();
    const byKarat: Record<number, typeof all[0]> = {};
    for (const p of all) {
      if (!byKarat[p.karat] || p.fetchedAt > byKarat[p.karat].fetchedAt) {
        byKarat[p.karat] = p;
      }
    }
    return Object.values(byKarat);
  },
});

export const seedGoldPrices = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("goldPrices").first();
    if (existing) return;

    const prices = [
      { karat: 18, pricePerGramEGP: 2850, pricePerGramUSD: 58.2, source: "Egyptian Gold Market" },
      { karat: 21, pricePerGramEGP: 3325, pricePerGramUSD: 67.9, source: "Egyptian Gold Market" },
      { karat: 24, pricePerGramEGP: 3800, pricePerGramUSD: 77.6, source: "Egyptian Gold Market" },
    ];
    for (const p of prices) {
      await ctx.db.insert("goldPrices", { ...p, fetchedAt: Date.now() });
    }
  },
});
