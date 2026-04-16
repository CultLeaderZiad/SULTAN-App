import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("halalGuide").collect();
  },
});

export const seedHalalGuide = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("halalGuide").first();
    if (existing) return;

    const entries = [
      {
        category: "banking",
        nameEn: "Bank Savings (Profit-sharing)",
        nameAr: "حسابات بنكية (مشاركة أرباح)",
        isHalal: true,
        reason: "Islamic banks offer profit-sharing accounts that comply with Sharia law",
        reasonAr: "البنوك الإسلامية تقدم حسابات مشاركة أرباح متوافقة مع الشريعة",
      },
      {
        category: "investment",
        nameEn: "Gold Investment",
        nameAr: "الاستثمار في الذهب",
        isHalal: true,
        reason: "Physical gold is halal as it is a tangible asset",
        reasonAr: "الذهب المادي حلال لأنه أصل ملموس",
      },
      {
        category: "investment",
        nameEn: "Sukuk (Islamic Bonds)",
        nameAr: "الصكوك",
        isHalal: true,
        reason: "Sukuk are asset-backed securities that comply with Sharia",
        reasonAr: "الصكوك أوراق مالية مدعومة بأصول ومتوافقة مع الشريعة",
      },
      {
        category: "investment",
        nameEn: "Real Estate",
        nameAr: "العقارات",
        isHalal: true,
        reason: "Real estate investment is halal when free from riba",
        reasonAr: "الاستثمار العقاري حلال عندما يكون خالي من الربا",
      },
      {
        category: "investment",
        nameEn: "Conventional Bonds",
        nameAr: "السندات التقليدية",
        isHalal: false,
        reason: "Bonds involve riba (interest) which is prohibited",
        reasonAr: "السندات تتضمن ربا وهو محرم",
        alternative: "Consider Sukuk as a halal alternative",
        alternativeAr: "فكر في الصكوك كبديل حلال",
      },
      {
        category: "investment",
        nameEn: "Halal Stocks",
        nameAr: "أسهم حلال",
        isHalal: true,
        reason: "Stocks in companies that comply with Sharia screening",
        reasonAr: "أسهم الشركات المتوافقة مع الفحص الشرعي",
      },
      {
        category: "crypto",
        nameEn: "Cryptocurrency",
        nameAr: "العملات الرقمية",
        isHalal: false,
        reason: "Scholars differ - most view it as gharar (excessive uncertainty)",
        reasonAr: "اختلف العلماء - أغلبهم يرى أنها غرر (عدم يقين مفرط)",
        alternative: "Consider gold or sukuk for halal investment",
        alternativeAr: "فكر في الذهب أو الصكوك كاستثمار حلال",
        scholarSource: "Dar al-Ifta, Islamic Fiqh Academy",
      },
    ];

    for (const e of entries) {
      await ctx.db.insert("halalGuide", e);
    }
  },
});
