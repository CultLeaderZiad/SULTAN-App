import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const totalUsers = users.length;
    const activeToday = users.filter((u) => u.lastSeenAt > dayAgo).length;
    const newThisWeek = users.filter((u) => u.createdAt > weekAgo).length;
    const planBreakdown = {
      trial: users.filter((u) => u.plan === "trial").length,
      basic: users.filter((u) => u.plan === "basic").length,
      pro: users.filter((u) => u.plan === "pro").length,
      sultan: users.filter((u) => u.plan === "sultan").length,
    };

    return { totalUsers, activeToday, newThisWeek, planBreakdown };
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

export const logAdminAction = mutation({
  args: {
    adminId: v.id("users"),
    action: v.string(),
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

export const getAdminLogs = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adminLogs")
      .withIndex("by_admin", (q) => q.eq("adminId", args.adminId))
      .collect();
  },
});
