import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLatestInflationData = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("inflationData").collect();
    if (all.length === 0) return null;
    return all.sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
  },
});

export const getInflationHistory = query({
  args: { months: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("inflationData").collect();
    return all
      .sort((a, b) => b.fetchedAt - a.fetchedAt)
      .slice(0, args.months);
  },
});

export const seedInflationData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("inflationData").first();
    if (existing) return;

    const months = [
      { month: "January", year: 2025, ratePercent: 24.1 },
      { month: "February", year: 2025, ratePercent: 23.5 },
      { month: "March", year: 2025, ratePercent: 22.8 },
      { month: "April", year: 2025, ratePercent: 21.6 },
      { month: "May", year: 2025, ratePercent: 20.9 },
      { month: "June", year: 2025, ratePercent: 19.4 },
      { month: "July", year: 2025, ratePercent: 18.7 },
      { month: "August", year: 2025, ratePercent: 17.9 },
      { month: "September", year: 2025, ratePercent: 17.2 },
      { month: "October", year: 2025, ratePercent: 16.8 },
      { month: "November", year: 2025, ratePercent: 16.1 },
      { month: "December", year: 2025, ratePercent: 15.6 },
    ];

    for (const m of months) {
      await ctx.db.insert("inflationData", {
        ...m,
        source: "Central Bank of Egypt",
        itemsAffected: [
          { name: "Food & Beverages", nameAr: "أغذية ومشروبات", priceChange: 25.3, category: "food" },
          { name: "Transportation", nameAr: "النقل", priceChange: 18.2, category: "transport" },
          { name: "Housing & Utilities", nameAr: "السكن والمرافق", priceChange: 12.5, category: "housing" },
          { name: "Healthcare", nameAr: "الرعاية الصحية", priceChange: 15.8, category: "health" },
        ],
        survivalTips: [
          "Buy gold as a hedge against inflation",
          "Convert savings to USD when EGP is weakening",
          "Stock up on non-perishable goods before price hikes",
          "Look for side income opportunities online",
        ],
        survivalTipsAr: [
          "اشتري ذهب كحماية من التضخم",
          "حول مدخراتك لدولار لما الجنيه بيضعف",
          "خزن المواد الغذائية قبل ما الأسعار تزيد",
          "دور على دخل إضافي من الإنترنت",
        ],
        fetchedAt: Date.now(),
      });
    }
  },
});
