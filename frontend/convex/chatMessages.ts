import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addMessage = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const clearMessages = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
